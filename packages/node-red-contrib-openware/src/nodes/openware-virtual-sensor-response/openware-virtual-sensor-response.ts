import { NodeInitializer } from "node-red";
import {
  OpenwareVirtualSensorResponseNode,
  OpenwareVirtualSensorResponseNodeDef,
} from "./modules/types";
import { resolvePending } from "../shared/virtualSensors";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareVirtualSensorResponseNodeConstructor(
    this: OpenwareVirtualSensorResponseNode,
    config: OpenwareVirtualSensorResponseNodeDef,
  ): void {
    RED.nodes.createNode(this, config);
    const node = this;

    node.on("input", (msg, send, done) => {
      const handleId = (msg as { _owvs?: unknown })._owvs;
      if (typeof handleId !== "string") {
        node.status({ fill: "red", shape: "dot", text: "msg._owvs missing" });
        node.warn(
          "Message has no _owvs handle - it must originate from an openware-virtual-sensor node",
        );
        done();
        return;
      }
      if (!resolvePending(handleId, msg.payload)) {
        node.status({
          fill: "yellow",
          shape: "dot",
          text: "request already completed",
        });
        done();
        return;
      }
      node.status({ fill: "green", shape: "dot", text: "responded" });
      done();
    });
  }

  RED.nodes.registerType(
    "openware-virtual-sensor-response",
    OpenwareVirtualSensorResponseNodeConstructor,
  );
};

export = nodeInit;
