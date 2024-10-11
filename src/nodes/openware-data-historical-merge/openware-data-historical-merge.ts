import { NodeInitializer } from "node-red";
import { OpenwareDataHistoricalMergeNode, OpenwareDataHistoricalMergeNodeDef } from "./modules/types";
import { ConfigNode } from "../shared/types";
import { HistoricMergePayloadType, PipePayloadType } from "./shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareDataHistoricalMergeNodeConstructor(
    this: OpenwareDataHistoricalMergeNode,
    config: OpenwareDataHistoricalMergeNodeDef
  ): void {
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    RED.nodes.createNode(this, config);
    const node = this;

    this.on("input", async function (msg, send, done) {
      console.log("Historical Merge Node: ", msg);
      if (!server || !server.credentials.session) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Select a open.WARE Server and sign in.",
        });
        return;
      }

      if (
        ((<HistoricMergePayloadType>msg.payload).sensorInfos &&
          (<HistoricMergePayloadType>msg.payload).start &&
          (<HistoricMergePayloadType>msg.payload).end) ||
        (<PipePayloadType>msg.payload).pipe
      ) {
        //@ts-expect-error
        const pipe = msg.payload.pipe || {
          stages: [
            {
              action: "sync_merge",
              params: {
                items: 
                  (<HistoricMergePayloadType>msg.payload).sensorInfos.map((info) => {
                    return {
                      stages: [
                        {
                          action: "historical",
                          params: {
                            source: info.source,
                            id: info.sensor,
                            start: (<HistoricMergePayloadType>msg.payload).start,
                            end: (<HistoricMergePayloadType>msg.payload).end,
                          }
                        },
                        {
                          action: "dimension_reduce",
                          params: {
                            dimension: info.dimension
                          }
                        }
                      ]
                    }
                  }),
              },
            },
          ],
        };
        console.log("Pipe: ", JSON.stringify(pipe, null, 2));
        node.status({ fill: "blue", shape: "dot", text: "Fetching data..." });
        const data = await server.api.pipe(pipe);
        console.log(JSON.stringify(data, null, 2));

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
          node.send(data);
          return;
        }
        if (config.output === "VALUES_ONLY") {
          node.send({
            payload: data.item.values,
            //@ts-expect-error
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

          node.send(Object.assign(data, { payload: csvData.join("\n") }));
          return;
        }
        send(msg);
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

  RED.nodes.registerType("openware-data-historical-merge", OpenwareDataHistoricalMergeNodeConstructor);
};

export = nodeInit;
