import { NodeInitializer, NodeMessage } from "node-red";
import { OpenwareSourcesNode, OpenwareSourcesNodeDef } from "./modules/types";
import { ConfigNode, SourceMessage } from "../shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareSourcesNodeConstructor(
    this: OpenwareSourcesNode,
    config: OpenwareSourcesNodeDef
  ): void {
    const server = RED.nodes.getNode(config.server) as ConfigNode;
    console.log("Server", server);
    RED.nodes.createNode(this, config);
    const node = this;
    node.on("input", async function (msg: NodeMessage) {
      if (!server || !server.credentials.session) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Select a open.WARE Server and sign in.",
        });
        return;
      } else {
        node.status({});
      }
      const sources = await server.api.sources();

      if (sources.status === "error") {
        node.error(sources);
        node.status({
          fill: "red",
          shape: "dot",
          text: sources.payload.error,
        });
        return;
      } else {
        node.status({});
      }
      node.send(sources);
    });
  }

  RED.nodes.registerType("openware-sources", OpenwareSourcesNodeConstructor);
};

export = nodeInit;
