import { EditorRED } from "node-red";
import { OpenwareDataHistoricalMergeEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

RED.nodes.registerType<OpenwareDataHistoricalMergeEditorNodeProperties>("openware-data-historical-merge", {
  category: "openWARE",
  color: "#a6bbcf",
  defaults: {
    name: { value: "openware-data-historical-merge", type: "text" },
    server: { value: "", type: "openware-config" },
    output: { value: "JSON", type: "text" },
    delimiter: { value: ",", type: "text" },
  },
  inputs: 1,
  outputs: 1,
  icon: "file.png",
  paletteLabel: "openware data historical merge",
  label: function () {
    return this.name || "openware data historical merge";
  },
  oneditprepare: function () {
    $("#node-input-output").typedInput({
      types: [
        {
          value: "JSON",

          options: [
            { value: "JSON", label: "JSON" },
            { value: "CSV", label: "CSV" },
            { value: "VALUES_ONLY", label: "JSON(only values)" },
          ],
        },
      ],
    });
    $("#node-input-output").change(function () {
      console.log("Changed", $("#node-input-output").val());
      const element = $("#node-input-delimiter").parent();
      if ($("#node-input-output").val() === "CSV") {
        console.log("CSV");
        if (element.show) {
          element.show();
        }
      } else {
        console.log("JSON");
        if (element.hide) {
          element.hide();
        }
      }
    });
  },
});
