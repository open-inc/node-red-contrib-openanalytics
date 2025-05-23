import { NodeInitializer } from "node-red";
import {
  OpenwareDataAggregateNode,
  OpenwareDataAggregateNodeDef,
} from "./modules/types";
import { ConfigNode, OWItemType, errorType } from "../shared/types";
import { AggregateMsgPayloadType } from "./shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareDataAggregateNodeConstructor(
    this: OpenwareDataAggregateNode,
    config: OpenwareDataAggregateNodeDef
  ): void {
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", async function (msg: AggregateMsgPayloadType) {
      if (!server || !server.credentials.session) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Select a open.WARE Server and sign in.",
        });
        return;
      }

      if (!msg.query && !msg.pipe) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Please provide a msg.query or msg.pipe",
        });
        return;
      }

      const maxIndex =
        "pipe" in msg ? msg.pipe!.length : msg.query!.sensorInfos.length;

      const response = [];
      for (let i = 0; i < maxIndex; i++) {
        const pipe = msg.pipe || {
          stages: [
            {
              action: "source_aggregation",
              params: {
                operation: config.operation || "mean",
                source: msg.query?.sensorInfos[i].source,
                id: msg.query?.sensorInfos[i].sensor,
                dimension: msg.query?.sensorInfos[i].dimension ?? 0,
                timeinterval: config.interval || "day",
                start: msg.query?.start,
                end: msg.query?.end,
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
        } else {
          node.status({});
        }
        response.push(data.payload);
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
    "openware-data-aggregate",
    OpenwareDataAggregateNodeConstructor
  );
};

export = nodeInit;
