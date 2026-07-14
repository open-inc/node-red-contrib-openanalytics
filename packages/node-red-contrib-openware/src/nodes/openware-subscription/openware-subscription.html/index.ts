import { EditorRED } from "node-red";
import { OpenwareSubscriptionEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

RED.nodes.registerType<OpenwareSubscriptionEditorNodeProperties>(
  "openware-subscription",
  {
    category: "openWARE",
    color: "#a6bbcf",

    defaults: {
      name: { value: "" },
      server: { value: "", type: "openware-config" },
    },
    inputs: 1,
    outputs: 1,
    icon: "file.png",
    paletteLabel: "openware subscription",
    label: function () {
      return this.name || "openware subscription";
    },
  }
);
