import { EditorRED } from "node-red";
import { OpenwareItemSelectEditorNodeProperties } from "./modules/types";
import { OWItemType } from "./../../shared/types";

declare const RED: EditorRED;

RED.nodes.registerType<OpenwareItemSelectEditorNodeProperties>(
  "openware-item-select",
  {
    category: "openWARE",
    color: "#a6bbcf",
    defaults: {
      name: { value: "" },
      server: { value: "", type: "openware-config" },
      item: { value: "" },
      dim: { value: "0" },
      start: { value: "0" },
      end: { value: "0" },
    },
    inputs: 1,
    outputs: 1,
    icon: "file.png",
    paletteLabel: "openware item select",
    label: function () {
      return this.name || "openware item select";
    },
    oneditprepare: async function () {
      const itemsReq = await fetch(`/openware/itemselect/${this.server}`);
      const items = (await itemsReq.json()) as OWItemType[];
      const itemsSelect = document.getElementById("node-input-item");
      const cItemValue = this.item.split("---");
      const dimSelect = document.getElementById("node-input-dim");
      if (itemsSelect && cItemValue.length === 2) {
        itemsSelect["value"] = cItemValue.join("---") as string;
        if (dimSelect) {
          dimSelect["value"] =
            //@ts-expect-error
            this.dim instanceof Number ? this.dim : parseInt(this.dim);

          const selected = items.find(
            (item) => item.id === cItemValue[1] && item.source === cItemValue[0]
          );
          if (selected) {
            dimSelect!.innerHTML = selected.valueTypes
              .map((dim, index) => {
                return `<sl-option value="${index}">${dim.name}</sl-option>`;
              })
              .join("\n");
            dimSelect!["value"] = this.dim;
          }
        }
      }
      itemsSelect!.innerHTML = items
        .sort((a, b) => (a.source + a.name).localeCompare(b.source + b.name))
        .map((item) => {
          return `<sl-option value="${item.source}---${item.id}">[${item.source}] ${item.name} - ${item.id}</sl-option>`;
        })
        .join("\n");

      itemsSelect?.addEventListener("sl-change", (event) => {
        //@ts-expect-error
        const sourceId = (event?.target.value || "").split("---");
        if (sourceId.length !== 2) {
          alert("Invalid selection");
          return;
        }
        const selected = items.find(
          (item) => item.id === sourceId[1] && item.source === sourceId[0]
        );
        if (!selected) {
          alert("Invalid selection");
          return;
        }
        dimSelect!.innerHTML = selected.valueTypes
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((dim, index) => {
            return `<sl-option value="${index}">${dim.name}</sl-option>`;
          })
          .join("\n");
      });
    },
  }
);
