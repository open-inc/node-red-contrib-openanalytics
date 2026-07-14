import { EditorRED } from "node-red";
import { OpenincParseFindEditorNodeProperties } from "./modules/types";
import { attachClassAutocomplete } from "../../shared/schema-editor";

declare const RED: EditorRED;

RED.nodes.registerType<OpenincParseFindEditorNodeProperties>(
  "openinc-parse-find",
  {
    category: "parse",
    color: "#61b7f2",
    defaults: {
      name: { value: "" },
      server: { value: "", type: "openinc-parse-config" },
      className: { value: "" },
      limit: { value: "" },
      order: { value: "" },
    },
    inputs: 1,
    outputs: 1,
    icon: "font-awesome/fa-search",
    paletteLabel: "parse find",
    label: function () {
      return (
        this.name ||
        (this.className ? `parse find: ${this.className}` : "parse find")
      );
    },
    oneditprepare: function () {
      attachClassAutocomplete("#node-input-className");
    },
  }
);
