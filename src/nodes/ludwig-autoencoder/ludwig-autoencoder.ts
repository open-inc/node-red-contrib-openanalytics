import { NodeInitializer } from "node-red";
import {
  LudwigAutoencoderNode,
  LudwigAutoencoderNodeDef,
} from "./modules/types";
import { ProcessChild } from "../shared/types";
import { autoencode } from "../shared/helper";
import { LudwigMsgType } from "../shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function LudwigAutoencoderNodeConstructor(
    this: LudwigAutoencoderNode,
    config: LudwigAutoencoderNodeDef
  ): void {
    let child: ProcessChild;
    if (child) {
      child.kill();
    }

    RED.nodes.createNode(this, config);
    var node = this;

    node.on("input", function (msg, send, done) {
      const cMsg = msg as LudwigMsgType;
      console.log(
        "Received data for autoencoder training:",
        cMsg.payload.values.length + " Datapoints"
      );

      child = autoencode(
        cMsg.payload,

        config.modelname || "Autoencoder",
        {
          preprocessing: {
            normalization: "zscore",
          },
        },
        0,
        24,
        (update) => {
          node.status({
            fill: "blue",
            shape: "dot",
            text: "Training: " + update.payload,
          });
          node.send([null, update, null]);
        }
      );
    });
  }

  RED.nodes.registerType(
    "ludwig-autoencoder",
    LudwigAutoencoderNodeConstructor
  );
};

export = nodeInit;
