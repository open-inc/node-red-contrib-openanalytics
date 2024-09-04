import { NodeInitializer } from "node-red";
import { OpenwareDataLiveNode, OpenwareDataLiveNodeDef } from "./modules/types";
import { ConfigNode, OWItemType, errorType } from "../shared/types";
import { LiveMsgPayloadType, LiveMsgType } from "./shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareDataLiveNodeConstructor(
    this: OpenwareDataLiveNode,
    config: OpenwareDataLiveNodeDef
  ): void {
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", async function (msg: LiveMsgType) {
      if (!server || !server.credentials.session) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Select a open.WARE Server and sign in.",
        });
        return;
      }

      if (
        (msg.payload as LiveMsgPayloadType).source &&
        (msg.payload as LiveMsgPayloadType).sensor
      ) {
        const date = msg.date || new Date().getTime();
        const amount = Math.max(msg.amount || config.amount || 1, 1);
        const data = await server.api.live(
          (msg.payload as LiveMsgPayloadType).source,
          (msg.payload as LiveMsgPayloadType).sensor,
          date,
          amount
        );
        if (data.status === "error") {
          node.status({
            fill: "red",
            shape: "dot",
            text:
              "Error fetching data: " + data.payload.response ||
              data.payload.error,
          });
          node.error(data);
          return;
        } else {
          node.status({});
        }

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
          text: "Missing required parameters source & sensor in payload",
        });
      }
    });
  }

  RED.nodes.registerType("openware-data-live", OpenwareDataLiveNodeConstructor);
};

export = nodeInit;
