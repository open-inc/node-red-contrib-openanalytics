import { EditorRED } from "node-red";
import { LudwigAutoencoderEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

RED.nodes.registerType<LudwigAutoencoderEditorNodeProperties>(
  "ludwig-autoencoder",
  {
    category: "openAnalytics",
    color: "#0dbc79",
    defaults: {
      name: { value: "autoencode", type: "text" },
      modelname: { value: "autoencoder", type: "text" },
      mode: { value: "train", type: "text" },
    },
    inputs: 1,
    outputs: 2,
    icon: "serial.svg",
    label: function () {
      return this.name || "ludwig-autoencoder";
    },
    oneditprepare: function () {
      $("#node-input-mode").typedInput({
        types: [
          {
            value: "train",
            options: [
              { label: "train", value: "train" },
              { label: "predict", value: "predict" },
            ],
          },
        ],
      });
    },
  }
);
