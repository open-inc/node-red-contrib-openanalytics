import { NodeInitializer } from "node-red";
import WebSocket = require("ws");
import { ConfigNode } from "../shared/types";
import {
  OpenwareStreamSendNode,
  OpenwareStreamSendNodeDef,
} from "./modules/types";
const OPEN_SOCKETS = {} as Record<string, WebSocket>;
const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareStreamSendNodeConstructor(
    this: OpenwareStreamSendNode,
    config: OpenwareStreamSendNodeDef
  ): void {
    if (config.server === undefined) return;
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    RED.nodes.createNode(this, config);

    const node = this;

    this.wsConnecting = setInterval(() => {
      if (server && server.credentials.session) {
        if (OPEN_SOCKETS[node.id]) {
          if (OPEN_SOCKETS[node.id].readyState === WebSocket.CONNECTING) {
            node.status({
              fill: "yellow",
              shape: "dot",
              text: "Connecting...",
            });
          }
          if (OPEN_SOCKETS[node.id].readyState === WebSocket.OPEN) {
            node.status({ fill: "green", shape: "dot", text: "Connected." });
          }
          if (OPEN_SOCKETS[node.id].readyState === WebSocket.CLOSING) {
            node.status({ fill: "yellow", shape: "dot", text: "Closing..." });
          }
          if (OPEN_SOCKETS[node.id].readyState === WebSocket.CLOSED) {
            node.status({ fill: "red", shape: "dot", text: "Disconnected." });
          }
        }

        if (
          !OPEN_SOCKETS[node.id] ||
          OPEN_SOCKETS[node.id].readyState === WebSocket.CLOSED ||
          OPEN_SOCKETS[node.id].readyState === WebSocket.CLOSING
        ) {
          const res = connect(node, server);
          if (res) {
            OPEN_SOCKETS[node.id] = res;
          } else {
            if (OPEN_SOCKETS[node.id]) {
              OPEN_SOCKETS[node.id].terminate();
            }
            delete OPEN_SOCKETS[node.id];
          }
        }
      } else {
        node.status({
          fill: "red",
          shape: "dot",
          text: "No or wrong login data.",
        });
      }
    }, 1000);

    node.on("close", function () {
      console.log("Cleanup WebSocket", node.id);
      if (OPEN_SOCKETS[node.id]) {
        OPEN_SOCKETS[node.id].terminate();
        delete OPEN_SOCKETS[node.id];
      }
      if (node.wsConnecting) {
        clearInterval(node.wsConnecting);
      }
    });

    node.on("input", function (msg: any) {
      if (
        !msg.payload ||
        !msg.payload.id ||
        !msg.payload.name ||
        !msg.payload.source ||
        !msg.payload.valueTypes ||
        !msg.payload.values
      ) {
        node.error({
          error: "No or wrong data in msg.payload",
        });
        return;
      }

      if (server.credentials.session) {
        if (
          OPEN_SOCKETS[node.id] &&
          OPEN_SOCKETS[node.id].readyState === WebSocket.OPEN
        ) {
          const message = JSON.stringify({
            action: config.mode,
            items: [msg.payload],
            session: server.credentials.session,
          });
          console.log("Sending message", message);
          OPEN_SOCKETS[node.id].send(message);
        }
      } else {
        console.log("No login data");
        node.error({
          error: "Login data incorrect / missing",
        });
      }
    });
  }

  RED.nodes.registerType(
    "openware-stream-send",
    OpenwareStreamSendNodeConstructor
  );

  function connect(node: OpenwareStreamSendNode, server: ConfigNode) {
    if (OPEN_SOCKETS[node.id]) {
      OPEN_SOCKETS[node.id].terminate();
    }

    const connectionString = `${server.host.replace("http", "ws")}:${
      server.port
    }/subscription`;
    console.log(
      "[" + node.id + "]Connecting to WebSocket: " + connectionString
    );
    let newWebSocket: WebSocket;
    try {
      newWebSocket = new WebSocket(connectionString);
      newWebSocket.on("open", () => {
        console.log("Connected to WebSocket " + connectionString);
      });
      newWebSocket.on("message", (event: string) => {
        node.send({ payload: JSON.parse(event) });
      });
      newWebSocket.on("close", (event: CloseEvent) => {
        console.log("Disconnected from WebSocket", event);
        // setTimeout(() => {
        //   OPEN_SOCKETS[node.id] = connect(node, server);
        // }, 2000);
      });
      newWebSocket.on("error", (event: Event) => {
        node.status({
          fill: "red",
          shape: "dot",
          text: "error" + JSON.stringify(event),
        });
      });
      return newWebSocket;
    } catch (e: any) {
      RED.log.error(
        "Error connecting to WebSocket\n" + e.message ||
          e.reason ||
          JSON.stringify(e)
      );
      return null;
    }
  }
};

export = nodeInit;
