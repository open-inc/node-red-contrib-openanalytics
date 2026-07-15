import { EditorRED } from "node-red";
import { OpenwareVirtualSensorEditorNodeProperties } from "./modules/types";
import { VirtualSensorDimension } from "../shared/types";

declare const RED: EditorRED;

const DIMENSION_TYPES = ["number", "string", "boolean", "object", "geo"];
const DEFAULT_DIMENSION: VirtualSensorDimension = {
  name: "Value",
  unit: "",
  type: "number",
};

RED.nodes.registerType<OpenwareVirtualSensorEditorNodeProperties>(
  "openware-virtual-sensor",
  {
    category: "openWARE",
    color: "#a6bbcf",
    defaults: {
      name: { value: "" },
      sensorId: { value: "", required: true },
      sensorName: { value: "", required: true },
      source: { value: "", required: true },
      valueTypes: { value: [{ ...DEFAULT_DIMENSION }] },
      meta: { value: "{}" },
      timeout: { value: 5000, validate: RED.validators.number() },
    },
    inputs: 1,
    outputs: 1,
    icon: "file.svg",
    paletteLabel: "virtual sensor",
    inputLabels: "live value update",
    outputLabels: ["historic request"],
    label: function () {
      return this.name || this.sensorName || this.sensorId || "virtual sensor";
    },
    oneditprepare: function () {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list = $("#node-input-valueTypes-container") as any;
      list.editableList({
        addButton: "add dimension",
        removable: true,
        sortable: true,
        height: 160,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addItem: function (container: any, _index: number, data: any) {
          const dim: VirtualSensorDimension =
            data && data.name !== undefined ? data : { ...DEFAULT_DIMENSION };
          const row = $("<div/>", {
            style: "display:flex; gap:4px; align-items:center;",
          }).appendTo(container);
          $(
            '<input type="text" class="vs-dim-name" placeholder="Name" style="flex:2; width:auto;">',
          )
            .val(dim.name)
            .appendTo(row);
          $(
            '<input type="text" class="vs-dim-unit" placeholder="Unit" style="flex:1; width:auto;">',
          )
            .val(dim.unit)
            .appendTo(row);
          const select = $(
            '<select class="vs-dim-type" style="flex:1; width:auto;"></select>',
          ).appendTo(row);
          DIMENSION_TYPES.forEach((t) =>
            $("<option/>", { value: t, text: t }).appendTo(select),
          );
          select.val(dim.type || "number");
        },
      });
      (this.valueTypes || [{ ...DEFAULT_DIMENSION }]).forEach(
        (vt: VirtualSensorDimension) => list.editableList("addItem", vt),
      );
    },
    oneditsave: function () {
      const dims: VirtualSensorDimension[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = ($("#node-input-valueTypes-container") as any).editableList(
        "items",
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items.each(function (this: any) {
        const row = $(this);
        dims.push({
          name: String(row.find(".vs-dim-name").val() || "Value"),
          unit: String(row.find(".vs-dim-unit").val() || ""),
          type: String(row.find(".vs-dim-type").val() || "number"),
        });
      });
      this.valueTypes = dims.length > 0 ? dims : [{ ...DEFAULT_DIMENSION }];
    },
  },
);
