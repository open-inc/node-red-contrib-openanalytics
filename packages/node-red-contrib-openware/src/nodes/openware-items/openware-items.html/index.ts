import { EditorRED } from "node-red";
import { OpenwareItemsEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

RED.nodes.registerType<OpenwareItemsEditorNodeProperties>("openware-items", {
  paletteLabel: "open.WARE Fetch Items",
  category: "openWARE",
  color: "#a6bbcf",
  defaults: {
    server: { value: "", type: "openware-config" },
    name: { value: "openware-items", type: "text" },
  },
  inputs: 1,
  outputs: 1,
  icon: "file.svg",
  label: function () {
    return this.name || "openware-items";
  },
});
