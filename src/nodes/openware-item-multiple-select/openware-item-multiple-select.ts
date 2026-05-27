import { NodeInitializer } from "node-red";
import {
  OpenwareItemMultipleSelectNode,
  OpenwareItemMultipleSelectNodeDef,
} from "./modules/types";
import { MultiSelectPayloadType, SensorInfoType } from "../shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareItemMultipleSelectNodeConstructor(
    this: OpenwareItemMultipleSelectNode,
    config: OpenwareItemMultipleSelectNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    const node = this;

    this.on("input", (msg: any, send, done) => {
      const items =
        (config.items?.length ?? 0) > 0
          ? config.items.map((el) => el.split("---"))
          : [];
      const dims = (config.dims?.length ?? 0) > 0 ? config.dims : [];

      for (const item of items) {
        if (item.length !== 2) {
          const err = new Error("Invalid item configuration");
          RED.log.error(err.message);
          done(err);
          return;
        }
      }

      const sensorInfos: SensorInfoType[] = [];
      for (const dim of dims) {
        const dimInfo = dim.split("---");
        if (dimInfo.length !== 3) {
          const err = new Error("Invalid dimension configuration");
          RED.log.error(err.message);
          done(err);
          return;
        }
        const parsed = parseInt(dimInfo[2], 10);
        sensorInfos.push({
          source: dimInfo[0],
          sensor: dimInfo[1],
          dimension: Number.isFinite(parsed) ? parsed : 0,
        });
      }

      if (sensorInfos.length === 0) {
        for (const item of items) {
          sensorInfos.push({ source: item[0], sensor: item[1] });
        }
      }

      if (!msg.query || typeof msg.query !== "object") {
        msg.query = {} as MultiSelectPayloadType;
      }
      msg.query.sensorInfos = msg.query.sensorInfos ?? sensorInfos;

      const startTs = new Date(config.start).getTime();
      const endTs = new Date(config.end).getTime();
      msg.query.start =
        msg.query.start ?? (Number.isFinite(startTs) ? startTs : undefined);
      msg.query.end =
        msg.query.end ?? (Number.isFinite(endTs) ? endTs : undefined);

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
