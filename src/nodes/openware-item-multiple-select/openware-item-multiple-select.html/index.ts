import { EditorRED } from "node-red";
import { OpenwareItemMultipleSelectEditorNodeProperties } from "./modules/types";
import { OWItemType, ValueType } from "../../shared/types";

declare const RED: EditorRED;

RED.nodes.registerType<OpenwareItemMultipleSelectEditorNodeProperties>("openware-item-multiple-select", {
  category: "openWARE",
  color: "#a6bbcf",
  defaults: {
    name: { value: "" },
    server: { value: "", type: "openware-config" },
    items: { value: [] },
    dims: { value: [] },
    start: { value: "" },
    end: { value: "" },
  },
  inputs: 1,
  outputs: 1,
  icon: "file.png",
  paletteLabel: "openware item multiple select",
  label: function () {
    return this.name || "openware item multiple select";
  },
  oneditprepare: async function () {
    const itemsSelect = document.getElementById("node-input-items");
    const cItemValues = this.items.map((el) => el.split("---"));
    const dimSelect = document.getElementById("node-input-dims");

    const setDimSelectFromSelectedItems = (selectedItems: OWItemType[], setValue: boolean) => {
      let dimSelectHTML = "";
      let valueTypes = <ValueType[]>[];
      for (let item of selectedItems) {
        dimSelectHTML += "\n<sl-divider></sl-divider>";
        dimSelectHTML += `<small>${item.source} - ${item.id}</small>`;
        valueTypes = item.valueTypes;
        dimSelectHTML += valueTypes
          .map((dim, index) => {
            return `<sl-option value="${item.source}---${item.id}---${index}">${dim.name}</sl-option>`;
          })
          .join("\n");
      }
      dimSelect!.innerHTML = dimSelectHTML;

      if (setValue) {
        dimSelect!["value"] = this.dims;
      }
    }

    const fetchItemAndDims = async () => {
      const itemsReq = await fetch(`/openware/itemselect/${this.server}`);
      const items = (await itemsReq.json()) as OWItemType[];

      if (itemsSelect && cItemValues.length > 0) {
        itemsSelect["value"] = cItemValues.map((el) => el.join("---") as string);

        if (dimSelect) {
          dimSelect["value"] = this.dims;

          const selected = items.filter(
            (item) => {
              for (let id of cItemValues) {
                if (item.id === id[1] && item.source === id[0]) {
                  return true;
                }
              }
              return false;
            }
          );

          if (selected.length > 0) {
            setDimSelectFromSelectedItems(selected, true);
          }
        }
      }
      itemsSelect!.innerHTML = items
        .sort((a, b) => (a.source + a.name + a.id).localeCompare(b.source + b.name + b.id))
        .map((item) => {
          return `<sl-option value="${item.source}---${item.id}">[${item.source}] ${item.name} - ${item.id}</sl-option>`;
        })
        .join("\n");

      itemsSelect?.addEventListener("sl-change", (event) => {
        // @ts-expect-error
        const value = event?.target.value;
        let values = []
        if (value instanceof Array) {
          values = value;
        } else {
          values = [(value || "")];
        }
        const sourceIds = values.map((val: string) => val.split("---"));

        const selected = items.filter(
          (item) => {
            for (let id of sourceIds) {
              if (item.id === id[1] && item.source === id[0]) {
                return true;
              }
            }
            return false;
          }
        );

        if (selected.length > 0) {
          setDimSelectFromSelectedItems(selected, false);
        }
      });
    }

    if (this.server !== "") {
      fetchItemAndDims()
    }

    const serverSelect = document.getElementById("node-input-server");
    serverSelect?.addEventListener("change", async (event) => {
      this.server = event.target["value"];
      fetchItemAndDims();
    });
  },
});
