import { NodeInitializer } from "node-red";
import {
  OpenwareDataHistoricalNode,
  OpenwareDataHistoricalNodeDef,
} from "./modules/types";
import { ConfigNode, OWItemType, errorType } from "../shared/types";
import { HistoricalMsgPayloadType } from "./shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareDataHistoricalNodeConstructor(
    this: OpenwareDataHistoricalNode,
    config: OpenwareDataHistoricalNodeDef
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
      } else {
        node.status({});
      }
      if (
        (<HistoricalMsgPayloadType>msg.payload).source &&
        (<HistoricalMsgPayloadType>msg.payload).sensor &&
        (<HistoricalMsgPayloadType>msg.payload).start &&
        (<HistoricalMsgPayloadType>msg.payload).end
      ) {
        const data = await server.api.history(
          (<HistoricalMsgPayloadType>msg.payload).source,
          (<HistoricalMsgPayloadType>msg.payload).sensor,
          (<HistoricalMsgPayloadType>msg.payload).start,
          (<HistoricalMsgPayloadType>msg.payload).end
        );
        if (data.status === "error") {
          node.status({
            fill: "red",
            shape: "dot",
            text: "Error fetching data.",
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
          //@ts-expect-error
          node.send({ payload: csvData.join("\n"), request: msg.payload });
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
    "openware-data-historical",
    OpenwareDataHistoricalNodeConstructor
  );
};

export = nodeInit;
