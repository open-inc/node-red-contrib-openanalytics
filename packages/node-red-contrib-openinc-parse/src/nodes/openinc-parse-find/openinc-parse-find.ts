import { NodeInitializer } from "node-red";
import { OpenincParseFindNode, OpenincParseFindNodeDef } from "./modules/types";
import { FindMsgType } from "./shared/types";
import { ParseConfigNode } from "../shared/types";
import { resolveQuery } from "../shared/helper";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenincParseFindNodeConstructor(
    this: OpenincParseFindNode,
    config: OpenincParseFindNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    const node = this;
    const server = RED.nodes.getNode(config.server) as ParseConfigNode | null;

    node.on("input", async function (msg: FindMsgType, send, done) {
      if (!server) {
        node.status({
          fill: "red",
          shape: "ring",
          text: "Select a Parse Server configuration.",
        });
        done();
        return;
      }

      const query = resolveQuery(msg.payload, config.className);

      if (!query.className) {
        node.status({ fill: "red", shape: "dot", text: "No className" });
        node.error(
          "No className configured and none provided in msg.payload.className",
          msg
        );
        done();
        return;
      }

      if (query.limit === undefined && config.limit !== "") {
        const limit = parseInt(config.limit, 10);
        if (!isNaN(limit)) query.limit = limit;
      }
      if (!query.order && config.order !== "") {
        query.order = config.order;
      }

      node.status({ fill: "blue", shape: "dot", text: "querying..." });

      const result = await server.api.find(query);

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
        text: `${result.payload.results?.length ?? 0} results`,
      });

      send({
        ...msg,
        payload: result.payload.results,
        count: result.payload.count,
        query,
      } as FindMsgType);
      done();
    });
  }

  RED.nodes.registerType("openinc-parse-find", OpenincParseFindNodeConstructor);
};

export = nodeInit;
