import { EditorRED } from "node-red";
import { OpenwareDataHistoricalEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

RED.nodes.registerType<OpenwareDataHistoricalEditorNodeProperties>(
  "openware-data-historical",
  {
    category: "openWARE",
    color: "#a6bbcf",
    defaults: {
      server: { value: "", type: "openware-config" },
      name: { value: "openware-data-history", type: "text" },
      output: { value: "JSON", type: "text" },
      delimiter: { value: ",", type: "text" },
    },
    inputs: 1,
    outputs: 1,
    icon: "file.svg",
    label: function () {
      return this.name || "openware-itemsopenware-data-history";
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
  }
);
