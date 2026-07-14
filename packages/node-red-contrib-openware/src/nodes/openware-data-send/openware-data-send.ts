import { NodeInitializer } from "node-red";
import { OpenwareDataSendNode, OpenwareDataSendNodeDef } from "./modules/types";

import { ConfigNode, OWItemType } from "../shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareDataSendNodeConstructor(
    this: OpenwareDataSendNode,
    config: OpenwareDataSendNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    const node = this;

    node.on("input", async function (msg, send, done) {
      if (!server || !server.credentials.session) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Select a open.WARE Server and sign in.",
        });
        done();
        return;
      }
      const mode = (config.mode === "push" ? "push" : "update");
      const res = await server.api.send(msg.payload as OWItemType, mode);
      if (res && typeof res === "object" && "error" in res) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Error sending data",
        });
        node.error(res, msg);
        done();
        return;
      }
      node.status({});
      send({ ...msg, payload: res });
      done();
    });
  }

  RED.nodes.registerType("openware-data-send", OpenwareDataSendNodeConstructor);
};

export = nodeInit;
