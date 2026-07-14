import { EditorRED } from "node-red";
import { OpenincParseSaveEditorNodeProperties } from "./modules/types";
import { attachClassAutocomplete } from "../../shared/schema-editor";

declare const RED: EditorRED;

RED.nodes.registerType<OpenincParseSaveEditorNodeProperties>(
  "openinc-parse-save",
  {
    category: "parse",
    color: "#61b7f2",
    defaults: {
      name: { value: "" },
      server: { value: "", type: "openinc-parse-config" },
      className: { value: "" },
      objectId: { value: "" },
    },
    inputs: 1,
    outputs: 1,
    icon: "font-awesome/fa-floppy-o",
    paletteLabel: "parse save",
    label: function () {
      return (
        this.name ||
        (this.className ? `parse save: ${this.className}` : "parse save")
      );
    },
    oneditprepare: function () {
      attachClassAutocomplete("#node-input-className");
    },
  }
);
