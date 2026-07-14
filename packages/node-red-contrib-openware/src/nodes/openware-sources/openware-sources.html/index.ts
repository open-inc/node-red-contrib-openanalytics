import { EditorRED } from "node-red";
import { OpenwareSourcesEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

RED.nodes.registerType<OpenwareSourcesEditorNodeProperties>(
  "openware-sources",
  {
    category: "openWARE",
    color: "#a6bbcf",
    defaults: {
      server: { value: "", type: "openware-config" },
      name: { value: "openware-sources", type: "text" },
    },
    inputs: 1,
    outputs: 1,
    icon: "file.svg",
    label: function () {
      return this.name || "openware-sources";
    },
  }
);
