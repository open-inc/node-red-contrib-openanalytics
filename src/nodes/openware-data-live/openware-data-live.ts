import { NodeInitializer } from "node-red";
import { OpenwareDataLiveNode, OpenwareDataLiveNodeDef } from "./modules/types";
import { ConfigNode, OWItemType, errorType } from "../shared/types";
import { LiveMsgPayloadType } from "./shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareDataLiveNodeConstructor(
    this: OpenwareDataLiveNode,
    config: OpenwareDataLiveNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    const node = this;

    node.on("input", async function (msg: LiveMsgPayloadType, send, done) {
      if (!server || !server.credentials.session) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Select a open.WARE Server and sign in.",
        });
        done();
        return;
      }
      if (!msg.query?.sensorInfos) {
        node.error({ payload: "No sensorInfos in msg.query" }, msg);
        done();
        return;
      }

      const response: Array<OWItemType | errorType> = [];
      for (let i = 0; i < msg.query.sensorInfos.length; i++) {
        const currentInfo = msg.query.sensorInfos[i];

        if (currentInfo.source && currentInfo.sensor) {
          const date = msg.date || msg.query?.end || Date.now();
          const amount = Math.max(msg.amount || config.amount || 1, 1);

          const data = await server.api.live(
            currentInfo.source,
            currentInfo.sensor,
            date,
            amount
          );
          if (data.status === "error") {
            node.status({
              fill: "red",
              shape: "dot",
              text:
                "Error fetching data: " +
                (data.payload.response || data.payload.error),
            });
          } else {
            node.status({});
          }
          response.push(data.payload);
        } else {
          response.push({
            error:
              "missing source/sensor infos in msg.query.sensorInfos at index " +
              i,
          });
        }
      }
      node.status({});

      if (config.output === "VALUES_ONLY") {
        send({
          ...msg,
          payload: response.map((item) =>
            "error" in item ? item : item.values
          ),
          valueTypes: response.map((item) =>
            "error" in item ? "error" : item.valueTypes
          ),
          request: msg.payload,
        });
      } else if (config.output === "CSV") {
        const mappedCSVData = response.map((data) => {
          if ("error" in data) {
            return { payload: "error", request: msg.payload };
          }
          const csvData = data.values.map(
            (v) =>
              `${v.date},${v.value
                .map((val, index) =>
                  data.valueTypes[index]?.type === "String" ? `"${val}"` : val
                )
                .join(config.delimiter)}`
          );
          csvData.unshift(
            ["date", ...data.valueTypes.map((v) => v.name)].join(
              config.delimiter
            )
          );
          return { payload: csvData.join("\n"), request: msg.payload };
        });
        send({ ...msg, payload: mappedCSVData, request: msg.payload });
      } else {
        send({ ...msg, payload: response });
      }
      done();
    });
  }

  RED.nodes.registerType("openware-data-live", OpenwareDataLiveNodeConstructor);
};

export = nodeInit;
