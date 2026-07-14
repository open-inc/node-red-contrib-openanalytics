import { EditorRED } from "node-red";
import { OpenincParseFetchRelationEditorNodeProperties } from "./modules/types";
import {
  attachClassAutocomplete,
  attachRelationKeyAutocomplete,
} from "../../shared/schema-editor";

declare const RED: EditorRED;

RED.nodes.registerType<OpenincParseFetchRelationEditorNodeProperties>(
  "openinc-parse-fetch-relation",
  {
    category: "parse",
    color: "#61b7f2",
    defaults: {
      name: { value: "" },
      server: { value: "", type: "openinc-parse-config" },
      relationKey: { value: "" },
      source: { value: "config" },
      className: { value: "" },
      objectId: { value: "" },
      targetClassName: { value: "" },
      limit: { value: "" },
      order: { value: "" },
    },
    inputs: 1,
    outputs: 1,
    icon: "font-awesome/fa-link",
    paletteLabel: "parse relation",
    label: function () {
      return (
        this.name ||
        (this.relationKey
          ? `parse relation: ${this.relationKey}`
          : "parse relation")
      );
    },
    oneditprepare: function () {
      const toggleRows = () => {
        const source = String($("#node-input-source").val() || "config");
        $(".node-row-config").toggle(source === "config");
      };
      $("#node-input-source").on("change", toggleRows);
      toggleRows();

      // Schema-driven autocomplete: parent class + target class from the class
      // list, relation key from the parent class's relation fields.
      attachClassAutocomplete("#node-input-className");
      attachClassAutocomplete("#node-input-targetClassName");
      attachRelationKeyAutocomplete(
        $("#node-input-relationKey"),
        "#node-input-className"
      );
    },
  }
);
