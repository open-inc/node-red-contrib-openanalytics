import { NodeInitializer } from "node-red";
import { OpenwareConfigNode, OpenwareConfigNodeDef } from "./modules/types";
import { initApi } from "../shared/initApi";
import { LoginStatus } from "../shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareConfigNodeConstructor(
    this: OpenwareConfigNode,
    config: OpenwareConfigNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    this.host = config.host;
    this.port = config.port;
    initApi(this, RED);
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

  // Snapshot endpoint so a freshly opened config dialog gets current state
  // before any new comms messages arrive.
  RED.httpAdmin.get(
    "/openware/config/:id/login-status",
    RED.auth.needsPermission("flows.read"),
    (req, res) => {
      const node = RED.nodes.getNode(String(req.params.id)) as OpenwareConfigNode | null;
      if (!node) {
        res.status(404).send({ error: "Config node not found" });
        return;
      }
      const fallback: LoginStatus = {
        state: "idle",
        text: "unknown",
        ts: 0,
      };
      res.send(node.lastLoginStatus ?? fallback);
    }
  );
};

export = nodeInit;
