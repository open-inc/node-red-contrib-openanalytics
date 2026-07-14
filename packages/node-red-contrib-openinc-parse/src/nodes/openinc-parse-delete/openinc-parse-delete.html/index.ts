import { EditorRED } from "node-red";
import { OpenincParseDeleteEditorNodeProperties } from "./modules/types";
import { attachClassAutocomplete } from "../../shared/schema-editor";

declare const RED: EditorRED;

RED.nodes.registerType<OpenincParseDeleteEditorNodeProperties>(
  "openinc-parse-delete",
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
    icon: "font-awesome/fa-trash-o",
    paletteLabel: "parse delete",
    label: function () {
      return (
        this.name ||
        (this.className ? `parse delete: ${this.className}` : "parse delete")
      );
    },
    oneditprepare: function () {
      attachClassAutocomplete("#node-input-className");
    },
  }
);
