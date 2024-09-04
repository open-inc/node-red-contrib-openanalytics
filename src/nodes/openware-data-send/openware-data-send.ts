import { NodeInitializer } from "node-red";
import { OpenwareDataSendNode, OpenwareDataSendNodeDef } from "./modules/types";

import { ConfigNode, OWItemType } from "../shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareDataSendNodeConstructor(
    this: OpenwareDataSendNode,
    config: OpenwareDataSendNodeDef
  ): void {
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", async function (msg) {
      if (!server || !server.credentials.session) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Select a open.WARE Server and sign in.",
        });
        return;
      }
      const mode = config.mode || "udpate";
      const res = await server.api.send(msg.payload as OWItemType, mode);
      node.send({ payload: res });
    });
  }

  RED.nodes.registerType("openware-data-send", OpenwareDataSendNodeConstructor);
};

export = nodeInit;
