import { NodeInitializer } from "node-red";
import { OpenwareCsv2owNode, OpenwareCsv2owNodeDef } from "./modules/types";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareCsv2owNodeConstructor(
    this: OpenwareCsv2owNode,
    config: OpenwareCsv2owNodeDef
  ): void {
    RED.nodes.createNode(this, config);

    this.on("input", (msg, send, done) => {
      send(msg);
      done();
    });
  }

  RED.nodes.registerType("openware-csv2ow", OpenwareCsv2owNodeConstructor);
};

export = nodeInit;
