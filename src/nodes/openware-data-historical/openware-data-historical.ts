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

    node.on("input", async function (msg: HistoricalMsgPayloadType) {
      if (!server || !server.credentials.session) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Select a open.WARE Server and sign in.",
        });
        return;
      }
      if (!msg.query?.sensorInfos) {
        node.error({ payload: "No sensorInfos in msg.query" });
        return;
      }

      const response = [];
      for (let i = 0; i < msg.query.sensorInfos.length; i++) {
        const currentInfo = msg.query.sensorInfos[i];

        if (currentInfo.source && currentInfo.sensor) {
          const end = msg.query?.end || new Date().getTime();
          const start =
            msg.query?.start ?? new Date(end - 1000 * 60 * 60).getTime();

          const data = await server.api.history(
            currentInfo.source,
            currentInfo.sensor,
            start,
            end
          );
          if (data.status === "error") {
            node.status({
              fill: "red",
              shape: "dot",
              text:
                "Error fetching data: " + data.payload.response ||
                data.payload.error,
            });
          } else {
            node.status({});
          }
          response.push(data.payload);
        } else {
          const x: errorType = {
            error:
              "missing source/sensor infos in msq.query.sensorInfos at index " +
              i,
          };
          response.push(x);
        }
      }
      node.status({});
      if (config.output === "JSON") {
        node.send({ ...msg, payload: response });
        return;
      }
      if (config.output === "VALUES_ONLY") {
        node.send({
          ...msg,
          payload: response.map((item: OWItemType | errorType) => {
            return "error" in item ? item : item.values;
          }),
          valueTypes: response.map((item: OWItemType | errorType) => {
            return "error" in item ? "error" : item.valueTypes;
          }),
          request: msg.payload,
        });
        return;
      }

      if (config.output === "CSV") {
        const mappedCSVData = response.map((data: OWItemType | errorType) => {
          if ("error" in data) {
            return { payload: "error", request: msg.payload };
          }
          const csvData = data.values.map(
            (v) =>
              `${v.date},${v.value
                .map((v, index) =>
                  data.valueTypes[index].type === "String" ? `"${v}"` : v
                )
                .join(config.delimiter)}`
          );

          csvData.unshift(
            ["date", ...data.valueTypes.map((v) => v.name)].join(
              config.delimiter
            )
          );
          const csvString = csvData.join("\n");
          return { payload: csvString, request: msg.payload };
        });
        node.send({
          ...msg,
          payload: mappedCSVData,
          request: msg.payload,
        });
        return;
      }
    });
  }
  RED.nodes.registerType(
    "openware-data-historical",
    OpenwareDataHistoricalNodeConstructor
  );
};

export = nodeInit;
