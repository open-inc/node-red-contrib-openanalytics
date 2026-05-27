import { NodeInitializer } from "node-red";
import {
  OpenwareItemSelectNode,
  OpenwareItemSelectNodeDef,
} from "./modules/types";
import { OpenwareConfigNode } from "../openware-config/modules/types";
import { MultiSelectPayloadType, SensorInfoType } from "../shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareItemSelectNodeConstructor(
    this: OpenwareItemSelectNode,
    config: OpenwareItemSelectNodeDef
  ): void {
    RED.nodes.createNode(this, config);

    this.on("input", (msg: any, send, done) => {
      const item = (config.item || "").split("---");
      if (item.length !== 2) {
        const err = new Error("Invalid item configuration");
        RED.log.error(err.message);
        done(err);
        return;
      }

      if (
        !msg.query ||
        typeof msg.query !== "object" ||
        !Array.isArray(msg.query.sensorInfos)
      ) {
        msg.query = { sensorInfos: [] } as MultiSelectPayloadType;
      }

      const dim = parseInt(config.dim, 10);
      const sensorInfo: SensorInfoType = {
        source: item[0],
        sensor: item[1],
        dimension: Number.isFinite(dim) ? dim : 0,
      };

      (msg.query as MultiSelectPayloadType).sensorInfos.push(sensorInfo);

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
    "openware-item-select",
    OpenwareItemSelectNodeConstructor
  );

  RED.httpAdmin.get(
    "/openware/itemselect/:confid",
    RED.auth.needsPermission("flows.read"),
    (req, res) => {
      const conf = RED.nodes.getNode(req.params.confid) as
        | OpenwareConfigNode
        | null;
      if (!conf?.api) {
        res.status(404).send({ error: "Config node not found or not ready" });
        return;
      }
      conf.api.items().then(
        (items) => {
          if (items.status === "error") {
            res.status(502).send({ error: items.payload.error });
            return;
          }
          res.send(items.payload);
        },
        (err) => res.status(500).send({ error: String(err) })
      );
    }
  );
};

export = nodeInit;
