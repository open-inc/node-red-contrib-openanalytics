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
      if (
        !msg.query ||
        typeof msg.query !== "object" ||
        !msg.query.sensorInfos ||
        typeof msg.query.sensorInfos !== "object"
      ) {
        msg.query = { sensorInfos: {} };
      }
      msg.query.sensorInfos.sensor = msg.query.sensorInfos.sensor || item[1];
      msg.query.sensorInfos.source = msg.query.sensorInfos.source || item[0];
      msg.query.sensorInfos.dimension =
        msg.query.sensorInfos.dimension ?? parseInt(config.dim);
      msg.query.start = msg.query.start ?? new Date(config.start).getTime();
      msg.query.end = msg.query.end ?? new Date(config.end).getTime();

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
