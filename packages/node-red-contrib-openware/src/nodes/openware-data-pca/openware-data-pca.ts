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
    RED.nodes.createNode(this, config);
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    const node = this;

    this.on("input", async function (msg, send, done) {
      if (!server || !server.credentials.session) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Select a open.WARE Server and sign in.",
        });
        done();
        return;
      }

      const query = msg.query as
        | (MultiSelectPayloadType & PipePayloadType)
        | undefined;
      const hasMultiSelect =
        !!query?.sensorInfos && !!query?.start && !!query?.end;
      const hasPipe = !!query?.pipe;

      if (!hasMultiSelect && !hasPipe) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Missing required parameters.",
        });
        done();
        return;
      }

      const pipe =
        query?.pipe ?? {
          stages: [
            {
              action: "sync_merge",
              params: {
                items: query!.sensorInfos.map((info) => ({
                  stages: [
                    {
                      action: "historical",
                      params: {
                        source: info.source,
                        id: info.sensor,
                        start: query!.start,
                        end: query!.end,
                      },
                    },
                    {
                      action: "dimension_reduce",
                      params: {
                        dimension: info.dimension,
                      },
                    },
                  ],
                })),
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

      node.status({ fill: "blue", shape: "dot", text: "Fetching data..." });
      const data = await server.api.pipe(pipe);

      if (data.status !== "success") {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Error fetching data. " + (data.payload.response || data.payload.error),
        });
        node.error(data, msg);
        done();
        return;
      }
      node.status({});

      if (config.output === "VALUES_ONLY") {
        send({
          ...msg,
          payload: data.item.values,
          valueTypes: data.item.valueTypes,
          request: msg.payload,
        });
      } else if (config.output === "CSV") {
        const csvData = data.item.values.map(
          (v) =>
            `${v.date},${v.value
              .map((val, index) =>
                data.item.valueTypes[index]?.type === "String" ? `"${val}"` : val
              )
              .join(config.delimiter)}`
        );
        csvData.unshift(
          ["date", ...data.item.valueTypes.map((v) => v.name)].join(
            config.delimiter
          )
        );
        send({ ...msg, ...data, payload: csvData.join("\n") });
      } else {
        send({ ...msg, ...data });
      }
      done();
    });
  }

  RED.nodes.registerType("openware-data-pca", OpenwareDataPcaNodeConstructor);
};

export = nodeInit;
