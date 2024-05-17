import { EditorRED } from "node-red";
import { LudwigPredictEditorNodeProperties } from "./modules/types";
import { ModelProperties } from "../shared/types";

declare const RED: EditorRED;

RED.nodes.registerType("ludwig-predict", {
  category: "openAnalytics",
  color: "#0dbc79",
  defaults: {
    name: { value: "predict", type: "text" },
    modelname: { value: "", type: "text" },
    modelversion: { value: "", type: "text" },
  },
  inputs: 1,
  outputs: 2,
  icon: "serial.svg",
  label: function () {
    return this.name || "ludwig-predict";
  },

  oneditprepare: function () {
    fetch("openware/ludwig/models").then((response) => {
      console.log(response);
      response.json().then((data) => {
        console.log(data);
        $("#node-input-modelname").typedInput({
          types: [
            {
              value: "",
              options: data.map((model: ModelProperties) => {
                return {
                  label: `${model.name}(${model.createdAt})`,
                  value: model.name,
                };
              }),
            },
          ],
        });
      });
    });
    $("#node-input-modelname").on("change", (e) => {
      const value = (e.target as HTMLInputElement).value;
      if (value == "") return;
      //$('#node-input-modelversion').parent().empty();
      fetch("openware/ludwig/models/" + value).then((response) => {
        response.json().then((data) => {
          console.log(data);

          $("#node-input-modelversion").replaceWith(
            '<input type="text" id="node-input-modelversion" placeholder="Choose a model version...">'
          );

          setTimeout(() => {
            $("#node-input-modelversion").typedInput({
              types: [
                {
                  value: "",
                  options: data.map((model: ModelProperties) => {
                    return {
                      label: `${model.name}(${model.createdAt})`,
                      value: model.name,
                    };
                  }),
                },
              ],
            });
          }, 500);
        });
      });
    });
  },
});
