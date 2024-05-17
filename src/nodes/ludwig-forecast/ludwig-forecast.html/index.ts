import { EditorRED } from "node-red";
import { LudwigForecastEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

RED.nodes.registerType<LudwigForecastEditorNodeProperties>("ludwig-forecast", {
  category: "openAnalytics",
  color: "#0dbc79",
  defaults: {
    name: { value: "forecast", type: "text" },
    modelname: { value: "forecast", type: "text" },
    window: { value: 24, type: "numerical" },
    dimension: { value: 0, type: "numerical" },
    mode: { value: "train", type: "text" },
    samples: { value: 1, type: "numerical" },
  },
  inputs: 1,
  outputs: 2,
  icon: "serial.svg",
  label: function () {
    return this.name || "ludwig-forecast";
  },
  oneditprepare: function () {
    $("#node-input-window").typedInput({
      //type: "num",
      types: ["num"],
    });
    $("#node-input-dimension").typedInput({
      //type: "num",
      types: ["num"],
    });
    $("#node-input-samples").typedInput({
      //type: "num",
      types: ["num"],
    });
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
});
