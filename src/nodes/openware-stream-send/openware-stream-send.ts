import { NodeInitializer } from "node-red";
import { ConfigNode } from "../shared/types";
import {
  OpenwareStreamSendNode,
  OpenwareStreamSendNodeDef,
} from "./modules/types";
import { isError } from "../shared/helper";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareStreamSendNodeConstructor(
    this: OpenwareStreamSendNode,
    config: OpenwareStreamSendNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    const node = this;

    if (config.server === undefined) {
      node.status({
        fill: "red",
        shape: "ring",
        text: "Select a open.WARE Server.",
      });
      return;
    }
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    if (!server) {
      node.status({
        fill: "red",
        shape: "ring",
        text: "Server config not found.",
      });
      return;
    }

    node.on("input", function (msg: any, send, done) {
      const payload = msg.payload;
      if (
        !payload ||
        typeof payload !== "object" ||
        !payload.id ||
        !payload.name ||
        !(payload.source || payload.user) ||
        !payload.valueTypes ||
        !payload.values
      ) {
        node.error(
          {
            error:
              "No or wrong data in msg.payload. Payload must be an object with id, name, source, valueTypes and values.",
          },
          msg
        );
        done();
        return;
      }
      if (!payload.source) {
        payload.source = payload.user;
      }
      const mode = config.mode === "push" ? "push" : "update";
      const res = server.api.sendStream(payload, mode);

      if (isError(res)) {
        node.status({ fill: "red", shape: "dot", text: "Send failed" });
        node.error({ error: res.payload.error }, msg);
        done();
        return;
      }
      node.status({});
      send(res);
      done();
    });
  }

  RED.nodes.registerType(
    "openware-stream-send",
    OpenwareStreamSendNodeConstructor
  );
};

export = nodeInit;
