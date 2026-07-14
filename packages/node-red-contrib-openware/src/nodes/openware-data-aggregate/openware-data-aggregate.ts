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
    RED.nodes.createNode(this, config);
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    const node = this;

    node.on(
      "input",
      async function (msg: AggregateMsgPayloadType, send, done) {
        if (!server || !server.credentials.session) {
          node.status({
            fill: "red",
            shape: "dot",
            text: "Select a open.WARE Server and sign in.",
          });
          done();
          return;
        }

        if (!msg.query && !msg.pipe) {
          node.status({
            fill: "red",
            shape: "dot",
            text: "Please provide a msg.query or msg.pipe",
          });
          done();
          return;
        }

        const maxIndex =
          "pipe" in msg && msg.pipe
            ? msg.pipe.length
            : msg.query!.sensorInfos.length;

        const response: Array<OWItemType | errorType> = [];
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
              text:
                "Error fetching data: " +
                (data.payload.response || data.payload.error),
            });
          } else {
            node.status({});
          }
          response.push(data.payload);
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
                    data.valueTypes[index]?.type === "String"
                      ? `"${val}"`
                      : val
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
      }
    );
  }

  RED.nodes.registerType(
    "openware-data-aggregate",
    OpenwareDataAggregateNodeConstructor
  );
};

export = nodeInit;
