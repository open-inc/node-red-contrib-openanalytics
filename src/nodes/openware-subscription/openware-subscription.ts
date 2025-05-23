import { NodeInitializer } from "node-red";
import {
  OpenwareSubscriptionNode,
  OpenwareSubscriptionNodeDef,
} from "./modules/types";
import WebSocket = require("ws");
import { ConfigNode } from "../shared/types";
import { SubscriptionMsgType } from "./shared/types";
import { unsubscribe } from "diagnostics_channel";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareSubscriptionNodeConstructor(
    this: OpenwareSubscriptionNode,
    config: OpenwareSubscriptionNodeDef
  ): void {
    if (config.server === undefined) return;
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    RED.nodes.createNode(this, config);
    const node = this;
    node.filter = new Set<string>();
    node.status({
      fill: "yellow",
      shape: "ring",
      text: "Not subscribed.",
    });

    node.on("close", function () {
      console.log("Canceling subscription");
      if (node.unsubscribe) {
        node.unsubscribe();
      }
    });

    node.on("input", function (msg: SubscriptionMsgType) {
      if (!msg.query && !msg.disconnect) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "No sources in sensorInfos in msg.query",
        });
        return;
      }

      if (msg.disconnect) {
        console.log("Canceling subscription");
        if (node.unsubscribe) {
          node.unsubscribe();
        }
        return;
      }
      //node.send({ payload: { server: server, config: config } });

      node.filter.clear();
      if (node.unsubscribe) {
        node.unsubscribe();
      }
      msg.query!.sensorInfos.forEach((item) => {
        node.filter.add(item.source + "---" + item.sensor);
      });

      if (server.credentials.session) {
        node.unsubscribe = server.api.addSubscription({
          filter: (msg) => node.filter.has(msg?.source + "---" + msg?.id),
          onMessage: (wsmsg) => {
            node.send({ ...msg, payload: wsmsg });
          },
          onStatus: (status) => {
            node.status(status);
            if (status.fill === "red") {
              node.send([null, { payload: { connected: false } }]);
            } else {
              node.send([null, { payload: { connected: true } }]);
            }
          },
        });
        node.status({
          fill: "yellow",
          shape: "dot",
          text: "Waiting for first message ....",
        });
      } else {
        node.status({ fill: "red", shape: "dot", text: "No Login provided" });
      }
    });
  }

  RED.nodes.registerType(
    "openware-subscription",
    OpenwareSubscriptionNodeConstructor
  );
};

export = nodeInit;
