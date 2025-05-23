import { NodeInitializer } from "node-red";
import WebSocket = require("ws");
import { ConfigNode } from "../shared/types";
import {
  OpenwareStreamSendNode,
  OpenwareStreamSendNodeDef,
} from "./modules/types";
import { isError } from "../shared/helper";
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

    node.on("input", function (msg: any) {
      if (
        !msg.payload ||
        !msg.payload.id ||
        !msg.payload.name ||
        !(msg.payload.source || msg.payload.user) ||
        !msg.payload.valueTypes ||
        !msg.payload.values
      ) {
        node.error({
          error:
            "No or wrong data in msg.payload. Payload must be an object with id, name, source, valueTypes and values.",
        });
        return;
      }
      if (!msg.payload.source) {
        msg.payload.source = msg.payload.user;
      }
      const res = server.api.sendStream(
        msg.payload,
        config.mode as "update" | "push"
      );

      if (isError(res)) {
        node.error({
          error: res.payload.error,
        });
        return;
      }
      node.send(res);
      return;
    });
  }

  RED.nodes.registerType(
    "openware-stream-send",
    OpenwareStreamSendNodeConstructor
  );
};

export = nodeInit;
