import { EditorRED } from "node-red";
import { OpenincParseChangestreamEditorNodeProperties } from "./modules/types";
import { attachClassAutocomplete } from "../../shared/schema-editor";

declare const RED: EditorRED;

RED.nodes.registerType<OpenincParseChangestreamEditorNodeProperties>(
  "openinc-parse-changestream",
  {
    category: "parse",
    color: "#61b7f2",
    defaults: {
      name: { value: "" },
      server: { value: "", type: "openinc-parse-config" },
      className: { value: "" },
      operations: { value: "" },
      interval: { value: "10" },
      limit: { value: "100" },
      emitExisting: { value: false },
    },
    inputs: 1,
    outputs: 1,
    icon: "font-awesome/fa-history",
    paletteLabel: "parse changestream",
    label: function () {
      return (
        this.name ||
        (this.className
          ? `parse changestream: ${this.className}`
          : "parse changestream")
      );
    },
    oneditprepare: function () {
      attachClassAutocomplete("#node-input-className");
    },
  }
);
