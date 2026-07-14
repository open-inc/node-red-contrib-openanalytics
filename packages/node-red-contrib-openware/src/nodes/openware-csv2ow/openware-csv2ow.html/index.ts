import { EditorRED } from "node-red";
import { OpenwareCsv2owEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

RED.nodes.registerType<OpenwareCsv2owEditorNodeProperties>("openware-csv2ow", {
  category: "openWARE",
  color: "#a6bbcf",
  defaults: {
    name: { value: "" },
  },
  inputs: 1,
  outputs: 1,
  icon: "file.png",
  paletteLabel: "openware csv2ow",
  label: function () {
    return this.name || "openware csv2ow";
  },
});
