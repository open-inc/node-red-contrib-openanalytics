import { NodeInitializer } from "node-red";
import { OpenwareConfigNode, OpenwareConfigNodeDef } from "./modules/types";
import { initApi } from "../shared/initApi";
const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareConfigNodeConstructor(
    this: OpenwareConfigNode,
    config: OpenwareConfigNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    this.host = config.host;
    this.port = config.port;
    initApi(this);
    this.on("close", () => {
      console.log("Closing API....");
      this.api.destroy();
    });
  }

  RED.nodes.registerType("openware-config", OpenwareConfigNodeConstructor, {
    credentials: {
      username: { type: "text" },
      password: { type: "password" },
      session: { type: "text" },
    },
  });
};

export = nodeInit;
