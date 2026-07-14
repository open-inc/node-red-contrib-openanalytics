import { NodeInitializer } from "node-red";
import { OpenincParseSaveNode, OpenincParseSaveNodeDef } from "./modules/types";
import { SaveMsgType } from "./shared/types";
import { ParseConfigNode } from "../shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenincParseSaveNodeConstructor(
    this: OpenincParseSaveNode,
    config: OpenincParseSaveNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    const node = this;
    const server = RED.nodes.getNode(config.server) as ParseConfigNode | null;

    node.on("input", async function (msg: SaveMsgType, send, done) {
      if (!server) {
        node.status({
          fill: "red",
          shape: "ring",
          text: "Select a Parse Server configuration.",
        });
        done();
        return;
      }

      const payload =
        msg.payload && typeof msg.payload === "object" ? msg.payload : {};

      const className = payload.className || config.className;
      if (!className) {
        node.status({ fill: "red", shape: "dot", text: "No className" });
        node.error(
          "No className configured and none provided in msg.payload.className",
          msg
        );
        done();
        return;
      }

      // objectId from the node settings wins, msg.payload.objectId is the
      // dynamic fallback. If neither is set, a new object is created.
      const objectId = config.objectId || payload.objectId || undefined;

      let data: Record<string, any>;
      if (payload.data && typeof payload.data === "object") {
        data = payload.data;
      } else {
        const { className: _c, objectId: _o, ...rest } = payload;
        data = rest;
      }

      node.status({
        fill: "blue",
        shape: "dot",
        text: objectId ? "updating..." : "creating...",
      });

      const result = objectId
        ? await server.api.update(className, objectId, data)
        : await server.api.create(className, data);

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

      node.status({
        fill: "green",
        shape: "dot",
        text: objectId ? "updated " + objectId : "created",
      });

      send({
        ...msg,
        payload: {
          className,
          objectId: objectId ?? result.payload.objectId,
          ...result.payload,
        },
        request: data,
      } as SaveMsgType);
      done();
    });
  }

  RED.nodes.registerType("openinc-parse-save", OpenincParseSaveNodeConstructor);
};

export = nodeInit;
