import { EditorRED } from "node-red";
import { OpenincParseSubscribeEditorNodeProperties } from "./modules/types";
import { attachClassAutocomplete } from "../../shared/schema-editor";

declare const RED: EditorRED;

RED.nodes.registerType<OpenincParseSubscribeEditorNodeProperties>(
  "openinc-parse-subscribe",
  {
    category: "parse",
    color: "#61b7f2",
    defaults: {
      name: { value: "" },
      server: { value: "", type: "openinc-parse-config" },
      className: { value: "" },
      where: { value: "" },
    },
    inputs: 1,
    outputs: 2,
    outputLabels: ["events", "connection status"],
    icon: "font-awesome/fa-bolt",
    paletteLabel: "parse subscribe",
    label: function () {
      return (
        this.name ||
        (this.className
          ? `parse subscribe: ${this.className}`
          : "parse subscribe")
      );
    },
    oneditprepare: function () {
      attachClassAutocomplete("#node-input-className");
    },
  }
);
