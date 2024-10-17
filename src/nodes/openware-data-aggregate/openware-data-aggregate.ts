import { NodeInitializer, NodeMessageInFlow } from "node-red";
import {
  OpenwareDataAggregateNode,
  OpenwareDataAggregateNodeDef,
} from "./modules/types";
import { ConfigNode, OWItemType, errorType } from "../shared/types";
import {
  AggregateMsgPayloadType,
  HistoricPayloadType,
  PipePayloadType,
} from "./shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareDataAggregateNodeConstructor(
    this: OpenwareDataAggregateNode,
    config: OpenwareDataAggregateNodeDef
  ): void {
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", async function (msg) {
      if (!server || !server.credentials.session) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Select a open.WARE Server and sign in.",
        });
        return;
      }

      if (
        ((<HistoricPayloadType>msg.payload).source &&
          (<HistoricPayloadType>msg.payload).sensor &&
          (<HistoricPayloadType>msg.payload).start &&
          (<HistoricPayloadType>msg.payload).end) ||
        (<PipePayloadType>msg.payload).pipe
      ) {
        //@ts-expect-error
        const pipe = msg.payload.pipe || {
          stages: [
            {
              action: "source_aggregation",
              params: {
                operation:
                  (<HistoricPayloadType>msg.payload).operation ||
                  config.operation ||
                  "mean",
                dimension: (<HistoricPayloadType>msg.payload).dimension || 0,
                timeinterval:
                  (<HistoricPayloadType>msg.payload).interval ||
                  config.interval ||
                  "day",
                start: (<HistoricPayloadType>msg.payload).start,
                end: (<HistoricPayloadType>msg.payload).end,
                source: (<HistoricPayloadType>msg.payload).source,
                id: (<HistoricPayloadType>msg.payload).sensor,
              },
            },
          ],
        };
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
      } else {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Missing required parameters.",
        });
      }
    });
  }

  RED.nodes.registerType(
    "openware-data-aggregate",
    OpenwareDataAggregateNodeConstructor
  );
};

export = nodeInit;
