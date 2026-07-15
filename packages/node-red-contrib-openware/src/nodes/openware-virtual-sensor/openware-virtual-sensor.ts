import { NodeInitializer } from "node-red";
import {
  OpenwareVirtualSensorNode,
  OpenwareVirtualSensorNodeDef,
} from "./modules/types";
import {
  registerVirtualSensor,
  registerVirtualSensorApi,
  unregisterVirtualSensor,
  updateLiveValue,
  VirtualSensorConfigData,
} from "../shared/virtualSensors";

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_DIMENSION = { name: "Value", unit: "", type: "number" };

function formatValue(value: unknown[]): string {
  const text = value
    .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
    .join(", ");
  return text.length > 20 ? text.substring(0, 20) + "…" : text;
}

const nodeInit: NodeInitializer = (RED): void => {
  registerVirtualSensorApi(RED);

  function OpenwareVirtualSensorNodeConstructor(
    this: OpenwareVirtualSensorNode,
    config: OpenwareVirtualSensorNodeDef,
  ): void {
    RED.nodes.createNode(this, config);
    const node = this;

    let meta: Record<string, unknown> = {};
    if (config.meta) {
      try {
        meta = JSON.parse(config.meta);
      } catch {
        node.warn("Invalid meta JSON - using an empty meta object");
      }
    }

    const timeout = Number(config.timeout);
    const sensorConfig: VirtualSensorConfigData = {
      sensorId: config.sensorId,
      sensorName: config.sensorName || config.name || config.sensorId,
      source: config.source,
      valueTypes:
        Array.isArray(config.valueTypes) && config.valueTypes.length > 0
          ? config.valueTypes
          : [{ ...DEFAULT_DIMENSION }],
      meta,
      timeout:
        Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_TIMEOUT_MS,
    };

    if (!sensorConfig.sensorId || !sensorConfig.source) {
      node.status({
        fill: "red",
        shape: "dot",
        text: "missing sensor id/source",
      });
      node.error("Virtual sensor requires a sensor id and a source");
      return;
    }

    const wires = (config as unknown as { wires?: string[][] }).wires;
    const wired = !!wires?.[0]?.length;

    const { duplicate } = registerVirtualSensor(node, sensorConfig, wired);
    if (duplicate) {
      node.status({
        fill: "red",
        shape: "dot",
        text: `duplicate id "${sensorConfig.sensorId}"`,
      });
      node.warn(
        `Another virtual sensor already uses the id "${sensorConfig.sensorId}" - this sensor will not be listed`,
      );
    } else {
      node.status({ fill: "grey", shape: "ring", text: "registered" });
    }

    node.on("input", (msg, send, done) => {
      try {
        const entries = updateLiveValue(node.id, msg.payload);
        const newest = entries[0];
        node.status({
          fill: "green",
          shape: "dot",
          text: `${formatValue(newest.value)} @ ${new Date(
            newest.date,
          ).toLocaleTimeString()}`,
        });
        done();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        node.status({ fill: "red", shape: "dot", text: message });
        done(err instanceof Error ? err : new Error(message));
      }
    });

    node.on("close", () => {
      unregisterVirtualSensor(node.id);
    });
  }

  RED.nodes.registerType(
    "openware-virtual-sensor",
    OpenwareVirtualSensorNodeConstructor,
  );
};

export = nodeInit;
