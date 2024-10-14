import { NodeInitializer } from "node-red";
import { OpenwareItemMultipleSelectNode, OpenwareItemMultipleSelectNodeDef } from "./modules/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareItemMultipleSelectNodeConstructor(
    this: OpenwareItemMultipleSelectNode,
    config: OpenwareItemMultipleSelectNodeDef
  ): void {
    RED.nodes.createNode(this, config);

    this.on("input", (msg: any, send, done) => {
      const items = config.items.length > 0 ? config.items.map(el => el.split("---")) : [];
      const dims = config.dims.length > 0 ? config.dims : [];

      const sensorInfos = dims.map((dim) => {
        const dimInfo = dim.split("---");
        if (dimInfo.length !== 3) {
          RED.log.error("Invalid dimension configuration");
          this.debug("Invalid dimension configuration");
          return;
        }

        return {
          source: dimInfo[0],
          sensor: dimInfo[1],
          dimension: dimInfo[2],
        };
      })
      for (const item of items) {
        if (item.length !== 2) {
          RED.log.error("Invalid item configuration");
          this.debug("Invalid item configuration");
          return;
        }
      }
      if (!msg.payload || typeof msg.payload !== "object") {
        msg.payload = {} as any;
      }
      msg.payload.sensorInfos = msg.payload.sensorInfos ?? sensorInfos;
      msg.payload.start = msg.payload.start ?? new Date(config.start).getTime();
      msg.payload.end = msg.payload.end ?? new Date(config.end).getTime();

      send(msg);
      done();
    });
  }

  RED.nodes.registerType("openware-item-multiple-select", OpenwareItemMultipleSelectNodeConstructor);
};

export = nodeInit;
