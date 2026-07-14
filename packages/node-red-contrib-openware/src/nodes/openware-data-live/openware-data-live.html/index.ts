import { EditorRED } from "node-red";
import { OpenwareDataLiveEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

RED.nodes.registerType<OpenwareDataLiveEditorNodeProperties>(
  "openware-data-live",
  {
    category: "openWARE",
    color: "#a6bbcf",
    defaults: {
      server: { value: "", type: "openware-config" },
      name: { value: "openware-data-live", type: "text" },
      amount: { value: 1, type: "number" },
      output: { value: "JSON", type: "text" },
      delimiter: { value: ",", type: "text" },
    },
    inputs: 1,
    outputs: 1,
    icon: "file.svg",
    label: function () {
      return this.name || "openware-itemsopenware-data-live";
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
      $("#node-input-output").on("change", function () {
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
