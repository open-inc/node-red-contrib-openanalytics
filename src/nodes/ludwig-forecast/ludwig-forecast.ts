import { NodeInitializer } from "node-red";
import { LudwigForecastNode, LudwigForecastNodeDef } from "./modules/types";
import { forecast } from "../shared/helper";
import { LudwigMsgType, ProcessChild } from "../shared/types";

const nodeInit: NodeInitializer = (RED): void => {
  function LudwigForecastNodeConstructor(
    this: LudwigForecastNode,
    config: LudwigForecastNodeDef
  ): void {
    let child: ProcessChild;
    if (child) {
      child.kill();
      child = null;
    }
    RED.nodes.createNode(this, config);
    const node = this;
    node.on("input", function (msg, send, done) {
      const cMsg = msg as unknown as LudwigMsgType;
      const mode = cMsg.mode || config.mode;
      if (mode === "train") {
        console.log(
          "Received data for forecast training:",
          cMsg.payload.values.length + " Datapoints"
        );
        child = forecast(
          cMsg.payload,
          config.modelname || "Forecast",
          {
            preprocessing: {
              normalization: "zscore",
            },
          },
          config.dimension || 0,
          config.window || 24,
          5,
          function (update) {
            if (update.topic === "update") {
              if (
                update.payload.indexOf("%") > -1 ||
                update.payload.indexOf("saved") > -1
              ) {
                node.status({
                  fill: "blue",
                  shape: "dot",
                  text: "Training: " + update.payload,
                });
              }

              send([update, null]);
            }
            if (update.topic === "done") {
              node.status({
                fill: "green",
                shape: "dot",
                text: "Done (Status): " + update.payload,
              });
              send([update, null]);
            }
            if (update.topic === "error") {
              node.status({
                fill: "red",
                shape: "dot",
                text: "Error: " + update.payload,
              });
              send([update, null]);
            }
          }
        );
      }
      if (mode === "predict") {
        console.log(
          "Received data for forecast prediction:",
          cMsg.payload.values.length + " Datapoints"
        );
        const data = {
          input: cMsg.payload.values
            .slice(0, config.window)
            .map((v) => {
              return v.value[config.dimension];
            })
            .join(" "),
        };
        console.log("Predicting", JSON.stringify(data), JSON.stringify(msg));
        node.send([
          null,
          null,
          null,
          {
            payload: data,
          },
        ]);
      }
    });
  }

  RED.nodes.registerType("ludwig-forecast", LudwigForecastNodeConstructor);
};

export = nodeInit;
