import { EditorRED } from "node-red";
import { OpenwareVirtualSensorResponseEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

RED.nodes.registerType<OpenwareVirtualSensorResponseEditorNodeProperties>(
  "openware-virtual-sensor-response",
  {
    category: "openWARE",
    color: "#a6bbcf",
    defaults: {
      name: { value: "" },
    },
    inputs: 1,
    outputs: 0,
    icon: "file.svg",
    align: "right",
    paletteLabel: "virtual sensor response",
    inputLabels: "historic response",
    label: function () {
      return this.name || "virtual sensor response";
    },
  },
);
