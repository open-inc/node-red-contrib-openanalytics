import { EditorRED } from "node-red";
import { OpenwareDataSendEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

RED.nodes.registerType<OpenwareDataSendEditorNodeProperties>(
  "openware-data-send",
  {
    category: "openWARE",
    color: "#a6bbcf",
    defaults: {
      server: { value: "", type: "openware-config" },
      name: { value: "openware-data-send", type: "text" },
      mode: { value: "update", type: "text" },
    },
    inputs: 1,
    outputs: 1,
    icon: "wifi.svg",
    label: function () {
      return this.name || "openware-data-send";
    },
    oneditprepare: function () {
      $("#node-input-mode").typedInput({
        types: [
          {
            value: "update",
            options: [
              { value: "push", label: "Push data (no overwrite)" },
              { value: "update", label: "Update data (upsert and overwrite)" },
            ],
          },
        ],
      });
    },
  }
);
