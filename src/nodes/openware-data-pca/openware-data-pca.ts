import { NodeInitializer } from "node-red";
import { OpenwareDataPcaNode, OpenwareDataPcaNodeDef } from "./modules/types";
import {
  ConfigNode,
  MultiSelectPayloadType,
  PipePayloadType,
} from "../shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareDataPcaNodeConstructor(
    this: OpenwareDataPcaNode,
    config: OpenwareDataPcaNodeDef
  ): void {
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    RED.nodes.createNode(this, config);
    const node = this;

    this.on("input", async function (msg, send, done) {
      if (!server || !server.credentials.session) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Select a open.WARE Server and sign in.",
        });
        return;
      }

      if (
        ((<MultiSelectPayloadType>msg.query)?.sensorInfos &&
          (<MultiSelectPayloadType>msg.query)?.start &&
          (<MultiSelectPayloadType>msg.query)?.end) ||
        (<PipePayloadType>msg.payload).pipe
      ) {
        //@ts-expect-error
        const pipe = msg.payload.pipe || {
          stages: [
            {
              action: "sync_merge",
              params: {
                items: (<MultiSelectPayloadType>msg.query)?.sensorInfos.map(
                  (info) => {
                    return {
                      stages: [
                        {
                          action: "historical",
                          params: {
                            source: info.source,
                            id: info.sensor,
                            start: (<MultiSelectPayloadType>msg.query)?.start,
                            end: (<MultiSelectPayloadType>msg.query)?.end,
                          },
                        },
                        {
                          action: "dimension_reduce",
                          params: {
                            dimension: info.dimension,
                          },
                        },
                      ],
                    };
                  }
                ),
              },
            },
            {
              action: "de.openinc.owee.transformation.StatisticTransformers",
              params: {
                operation: "pca",
              },
            },
          ],
        };

        // send({
        //   ...msg,
        //   payload: {
        //     pipe: pipe,
        //     server: server,
        //   },
        // });

        node.status({ fill: "blue", shape: "dot", text: "Fetching data..." });
        const data = await server.api.pipe(pipe);

        if (data.status !== "success") {
          node.status({
            fill: "red",
            shape: "dot",
            text: "Error fetching data." + data.payload.error,
          });
          node.error(data);
          return;
        }
        node.status({});
        if (config.output === "JSON") {
          node.send({ ...msg, ...data });
          return;
        }
        if (config.output === "VALUES_ONLY") {
          node.send({
            ...msg,
            payload: data.item.values,
            valueTypes: data.item.valueTypes,
            request: msg.payload,
          });
          return;
        }
        if (config.output === "CSV") {
          const csvData = data.item.values.map(
            (v) =>
              `${v.date},${v.value
                .map((v, index) =>
                  data.item.valueTypes[index].type === "String" ? `"${v}"` : v
                )
                .join(config.delimiter)}`
          );

          csvData.unshift(
            ["date", ...data.item.valueTypes.map((v) => v.name)].join(
              config.delimiter
            )
          );

          node.send({ ...msg, ...data, payload: csvData.join("\n") });
          return;
        }
        done();
      } else {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Missing required parameters.",
        });
        console.log("Missing required parameters.");
        console.log(msg.payload);
      }
    });
  }

  RED.nodes.registerType("openware-data-pca", OpenwareDataPcaNodeConstructor);
};

export = nodeInit;
