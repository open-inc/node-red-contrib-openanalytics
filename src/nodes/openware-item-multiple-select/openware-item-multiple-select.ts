import { NodeInitializer } from "node-red";
import {
  OpenwareItemMultipleSelectNode,
  OpenwareItemMultipleSelectNodeDef,
} from "./modules/types";
import { MultiSelectPayloadType } from "../shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareItemMultipleSelectNodeConstructor(
    this: OpenwareItemMultipleSelectNode,
    config: OpenwareItemMultipleSelectNodeDef
  ): void {
    RED.nodes.createNode(this, config);

    this.on("input", (msg: any, send, done) => {
      const items =
        config.items.length > 0
          ? config.items.map((el) => el.split("---"))
          : [];
      const dims = config.dims.length > 0 ? config.dims : [];

      let sensorInfos = dims.map((dim) => {
        const dimInfo = dim.split("---");
        if (dimInfo.length !== 3) {
          RED.log.error("Invalid dimension configuration");
          this.debug("Invalid dimension configuration");
          return;
        }

        return {
          source: dimInfo[0],
          sensor: dimInfo[1],
          dimension: parseInt(dimInfo[2]),
        } as MultiSelectPayloadType["sensorInfos"][number];
      });

      for (const item of items) {
        if (item.length !== 2) {
          RED.log.error("Invalid item configuration");
          this.debug("Invalid item configuration");
          return;
        }
      }

      if (sensorInfos.length === 0) {
        sensorInfos = items.map((item) => {
          return {
            source: item[0],
            sensor: item[1],
          };
        });
      }

      if (!msg.query || typeof msg.query !== "object") {
        msg.query = {};
      }
      console.log("start", config.start);
      console.log("end", config.end);
      msg.query.sensorInfos = msg.query.sensorInfos ?? sensorInfos;
      msg.query.start = msg.query.start ?? new Date(config.start).getTime();
      msg.query.end = msg.query.end ?? new Date(config.end).getTime();
      console.log("msg.query:", msg.query);
      console.log("sensorInfos:", sensorInfos);
      console.log("items:", items);
      send(msg);
      done();
    });
  }

  RED.nodes.registerType(
    "openware-item-multiple-select",
    OpenwareItemMultipleSelectNodeConstructor
  );
};

export = nodeInit;
