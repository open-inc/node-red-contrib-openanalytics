import { NodeInitializer } from "node-red";
import {
  OpenincParseDeleteNode,
  OpenincParseDeleteNodeDef,
} from "./modules/types";
import { DeleteMsgType } from "./shared/types";
import { ParseConfigNode } from "../shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenincParseDeleteNodeConstructor(
    this: OpenincParseDeleteNode,
    config: OpenincParseDeleteNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    const node = this;
    const server = RED.nodes.getNode(config.server) as ParseConfigNode | null;

    node.on("input", async function (msg: DeleteMsgType, send, done) {
      if (!server) {
        node.status({
          fill: "red",
          shape: "ring",
          text: "Select a Parse Server configuration.",
        });
        done();
        return;
      }

      let className = config.className;
      let objectId = config.objectId;

      if (typeof msg.payload === "string" && msg.payload !== "") {
        objectId = objectId || msg.payload;
      } else if (msg.payload && typeof msg.payload === "object") {
        className = msg.payload.className || className;
        objectId = objectId || msg.payload.objectId || "";
      }

      if (!className || !objectId) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "className and objectId required",
        });
        node.error(
          "Missing className or objectId (settings or msg.payload)",
          msg
        );
        done();
        return;
      }

      node.status({ fill: "blue", shape: "dot", text: "deleting..." });

      const result = await server.api.destroy(className, objectId);

      if (result.status === "error") {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Error: " + (result.payload.error ?? "unknown"),
        });
        node.error(result.payload, msg);
        done();
        return;
      }

      node.status({ fill: "green", shape: "dot", text: "deleted " + objectId });

      send({
        ...msg,
        payload: { className, objectId, deleted: true },
      } as DeleteMsgType);
      done();
    });
  }

  RED.nodes.registerType(
    "openinc-parse-delete",
    OpenincParseDeleteNodeConstructor
  );
};

export = nodeInit;
