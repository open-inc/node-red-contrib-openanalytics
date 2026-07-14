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
      const itemsSelect = document.getElementById("node-input-item");
      const cItemValue = this.item.split("---");
      const dimSelect = document.getElementById("node-input-dim");
      const setDimSelectFromSelectedItem = (
        selectedItem: OWItemType,
        setValue: boolean
      ) => {
        if (dimSelect) {
          dimSelect!.innerHTML = selectedItem.valueTypes
            .map((dim, index) => {
              return `<sl-option value="${index}">${dim.name}</sl-option>`;
            })
            .join("\n");
          if (setValue) {
            dimSelect!["value"] = this.dim;
          }
        }
      };

      let allItems: OWItemType[] = [];
      const sortItems = (arr: OWItemType[]) =>
        [...arr].sort((a, b) =>
          (a.source + a.name).localeCompare(b.source + b.name)
        );

      const renderOptions = (query: string) => {
        if (!itemsSelect) return;
        const q = query.trim().toLowerCase();
        const currentValue = (itemsSelect as any).value as string | undefined;
        const filtered = allItems.filter((item) => {
          if (!q) return true;
          const text =
            `[${item.source}] ${item.name} - ${item.id}`.toLowerCase();
          const val = `${item.source}---${item.id}`.toLowerCase();
          if (currentValue && val === currentValue.toLowerCase()) return true;
          return text.includes(q) || val.includes(q);
        });
        itemsSelect.innerHTML = sortItems(filtered)
          .map(
            (item) =>
              `<sl-option value="${item.source}---${item.id}">[${item.source}] ${item.name} - ${item.id}</sl-option>`
          )
          .join("\n");
        // Re-apply value so Shoelace keeps the selection after innerHTML changes
        if (currentValue) (itemsSelect as any).value = currentValue;
        const countEl = document.getElementById("openware-item-select-count");
        if (countEl) {
          countEl.textContent = q
            ? `${filtered.length} / ${allItems.length} match`
            : `${allItems.length} items`;
        }
      };

      const fetchItemAndDims = async () => {
        const itemsReq = await fetch(`openware/itemselect/${this.server}`);
        allItems = (await itemsReq.json()) as OWItemType[];

        // If the config is reopened then we need to set the value of the select for input and dimension:
        if (itemsSelect && cItemValue.length === 2) {
          itemsSelect["value"] = cItemValue.join("---") as string;
          if (dimSelect) {
            dimSelect["value"] =
              // @ts-expect-error
              this.dim instanceof Number ? this.dim : parseInt(this.dim);

            const selected = allItems.find(
              (item) =>
                item.id === cItemValue[1] && item.source === cItemValue[0]
            );
            if (selected) {
              setDimSelectFromSelectedItem(selected, true);
            }
          }
        }

        const searchInput = document.getElementById(
          "openware-item-select-search"
        ) as HTMLInputElement | null;

        renderOptions(searchInput?.value || "");

        if (searchInput && !(searchInput as any)._owFilterAttached) {
          (searchInput as any)._owFilterAttached = true;
          searchInput.addEventListener("input", () => {
            renderOptions(searchInput.value || "");
          });
        }

        itemsSelect?.addEventListener("sl-change", (event) => {
          //@ts-expect-error
          const sourceId = (event?.target.value || "").split("---");
          if (sourceId.length !== 2) {
            alert("Invalid selection");
            return;
          }
          const selected = allItems.find(
            (item) => item.id === sourceId[1] && item.source === sourceId[0]
          );
          if (!selected) {
            alert("Invalid selection");
            return;
          }
          setDimSelectFromSelectedItem(selected, false);
        });
      };

      if (this.server !== "") {
        fetchItemAndDims();
      }

      const serverSelect = document.getElementById("node-input-server");
      serverSelect?.addEventListener("change", async (event) => {
        this.server = event.target["value"];
        fetchItemAndDims();
      });
    },
  }
);
