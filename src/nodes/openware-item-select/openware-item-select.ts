import { NodeInitializer, NodeMessage, NodeMessageInFlow } from "node-red";
import {
  OpenwareItemSelectNode,
  OpenwareItemSelectNodeDef,
} from "./modules/types";
import { OpenwareConfigNode } from "../openware-config/modules/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareItemSelectNodeConstructor(
    this: OpenwareItemSelectNode,
    config: OpenwareItemSelectNodeDef
  ): void {
    RED.nodes.createNode(this, config);

    this.on("input", (msg: any, send, done) => {
      const item = config.item.split("---");
      if (item.length !== 2) {
        RED.log.error("Invalid item configuration");
        this.debug("Invalid item configuration");
        return;
      }
      if (!msg.payload || typeof msg.payload !== "object") {
        msg.payload = {} as any;
      }
      msg.payload.sensor = msg.payload.sensor || item[1];
      msg.payload.source = msg.payload.source || item[0];
      msg.payload.dimension = msg.payload.dimension ?? parseInt(config.dim);
      msg.payload.start = msg.payload.start ?? new Date(config.start).getTime();
      msg.payload.end = msg.payload.end ?? new Date(config.end).getTime();

      send(msg);
      done();
    });
  }

  RED.nodes.registerType(
    "openware-item-select",
    OpenwareItemSelectNodeConstructor
  );
  RED.httpAdmin.get("/openware/itemselect/:confid", function (req, res) {
    console.log("Items for: ", req.params.confid);
    const conf = RED.nodes.getNode(req.params.confid) as OpenwareConfigNode;
    conf.api.items().then((items) => {
      res.send(items.payload);
    });
  });
};

export = nodeInit;
