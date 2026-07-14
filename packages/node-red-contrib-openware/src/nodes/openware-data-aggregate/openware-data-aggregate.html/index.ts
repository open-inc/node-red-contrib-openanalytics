import { EditorRED } from "node-red";
import { OpenwareDataAggregateEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

RED.nodes.registerType<OpenwareDataAggregateEditorNodeProperties>(
  "openware-data-aggregate",
  {
    category: "openWARE",
    color: "#a6bbcf",
    defaults: {
      server: { value: "", type: "openware-config" },
      name: { value: "openware-data-aggregate", type: "text" },
      output: { value: "JSON", type: "text" },
      delimiter: { value: ",", type: "text" },
      interval: { value: "hour", type: "text" },
      operation: { value: "mean", type: "text" },
    },
    inputs: 1,
    outputs: 1,
    icon: "file.svg",
    label: function () {
      return this.name || "openware-itemsopenware-data-aggregate-time";
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
      $("#node-input-interval").typedInput({
        types: [
          {
            value: "hour",
            options: [
              { value: "second", label: "seconds" },
              { value: "minute", label: "minutes" },
              { value: "hour", label: "hours" },
              { value: "day", label: "days" },
              { value: "week", label: "weeks" },
              { value: "month", label: "months" },
              { value: "year", label: "years" },
            ],
          },
        ],
      });
      $("#node-input-operation").typedInput({
        types: [
          {
            value: "mean",
            options: [
              { value: "sum", label: "sum" },
              { value: "mean", label: "mean" },
              { value: "min", label: "min" },
              { value: "max", label: "max" },
              { value: "count", label: "count" },
              { value: "diffminmax", label: "diffminmax" },
              { value: "difffirstlast", label: "difffirstlast" },
              { value: "first", label: "first" },
              { value: "last", label: "last" },
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
