import { NodeInitializer } from "node-red";
import {
  OpenwareSubscriptionNode,
  OpenwareSubscriptionNodeDef,
} from "./modules/types";
import WebSocket = require("ws");
import { ConfigNode } from "../shared/types";
import { SubscriptionMsgType } from "./shared/types";

function connect(
  webSocket: WebSocket | null,
  node: OpenwareSubscriptionNode,
  server: ConfigNode,
  sources: string[]
) {
  if (webSocket) {
    webSocket.close();
  }

  console.log("connecting to WebSocket!", server);
  webSocket = new WebSocket(
    `${server.host.replace("http", "ws")}:${server.port}/subscription`
  );
  webSocket.on("open", () => {
    console.log("Connected to WebSocket");
    node.status({ fill: "blue", shape: "dot", text: "subscribing..." });
    const msg = {
      action: "subscribe",
      session: server.credentials.session,
      sources: sources,
    };

    webSocket!.send(JSON.stringify(msg));
  });
  webSocket.on("message", (event: string) => {
    node.status({ fill: "green", shape: "dot", text: "connected" });
    try {
      const data = JSON.parse(event);
      node.send({ payload: data });
    } catch (error) {
      console.error("Error parsing message\n" + event);
    }
  });
  webSocket.on("close", (event: CloseEvent) => {
    console.log("Disconnected from WebSocket", event);
    node.status({ fill: "red", shape: "dot", text: "disconnected." });
    node.webSocket = null;
  });
  webSocket.on("error", (event: Event) => {
    node.status({
      fill: "red",
      shape: "dot",
      text: "error" + JSON.stringify(event),
    });
  });
  return webSocket;
}

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareSubscriptionNodeConstructor(
    this: OpenwareSubscriptionNode,
    config: OpenwareSubscriptionNodeDef
  ): void {
    if (config.server === undefined) return;
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    RED.nodes.createNode(this, config);
    const node = this;
    setTimeout(() => {
      node.status({ fill: "red", shape: "dot", text: "disconnected." });
    }, 500);

    node.on("close", function () {
      console.log("Disconnecting from WebSocket");
      if (node.webSocket) {
        node.webSocket.close();
        node.webSocket = null;
        console.log("Disconnected");
      }
    });

    node.on("input", function (msg: SubscriptionMsgType) {
      if (
        (!msg.payload ||
          !Array.isArray(msg.payload) ||
          msg.payload.length < 1) &&
        !msg.disconnect
      ) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "No sources specified in msg.payload",
        });
        return;
      }

      if (msg.disconnect) {
        console.log("Disconnecting from WebSocket");
        if (node.webSocket) {
          node.webSocket.close();
          node.webSocket = null;
        }
        return;
      }
      //node.send({ payload: { server: server, config: config } });
      if (server.credentials.session) {
        node.webSocket = connect(
          node.webSocket,
          node,
          server,
          msg.payload as string[]
        );
        setInterval(() => {
          if (node.webSocket) {
            node.webSocket.send(
              JSON.stringify({
                action: "ping",
              })
            );
          } else {
            node.webSocket = connect(
              node.webSocket,
              node,
              server,
              msg.payload as string[]
            );
          }
        }, 60 * 1000);
      } else {
        node.status({ fill: "red", shape: "dot", text: "disconnected." });
      }
    });
  }

  RED.nodes.registerType(
    "openware-subscription",
    OpenwareSubscriptionNodeConstructor
  );
};

export = nodeInit;
