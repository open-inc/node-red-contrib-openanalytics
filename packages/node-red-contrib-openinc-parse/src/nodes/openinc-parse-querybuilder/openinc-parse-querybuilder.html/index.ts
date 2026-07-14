import { EditorRED } from "node-red";
import { OpenincParseQuerybuilderEditorNodeProperties } from "./modules/types";
import { QueryCondition } from "../shared/types";
import {
  attachClassAutocomplete,
  attachFieldAutocomplete,
} from "../../shared/schema-editor";

declare const RED: EditorRED;

const OPERATORS: Array<[string, string]> = [
  ["equalTo", "=="],
  ["notEqualTo", "!="],
  ["greaterThan", ">"],
  ["greaterThanOrEqualTo", ">="],
  ["lessThan", "<"],
  ["lessThanOrEqualTo", "<="],
  ["containedIn", "in list"],
  ["notContainedIn", "not in list"],
  ["exists", "exists"],
  ["doesNotExist", "does not exist"],
  ["contains", "contains"],
  ["startsWith", "starts with"],
  ["matchesRegex", "matches regex"],
];

const VALUE_TYPES: Array<[string, string]> = [
  ["str", "string"],
  ["num", "number"],
  ["bool", "boolean"],
  ["json", "JSON"],
  ["date", "date"],
  ["pointer", "pointer"],
  ["msg", "msg property"],
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const OP_LABEL: Record<string, string> = Object.fromEntries(OPERATORS);
const TYPE_LABEL: Record<string, string> = Object.fromEntries(VALUE_TYPES);

// Operators that ignore the value type — listed once under "General".
const TYPE_AGNOSTIC_OPS = ["exists", "doesNotExist"];

// The combined picker is the product of every operator and every datatype,
// grouped by datatype. Value-agnostic operators (exists / does not exist) are
// listed once at the top. Value format is "<op>|<valueType>" ("-" when the
// datatype is irrelevant), which oneditsave splits back into op + valueType.
function combinedOptionsHtml(): string {
  const parts: string[] = [];
  parts.push("<small>General</small>");
  for (const op of TYPE_AGNOSTIC_OPS) {
    parts.push(`<sl-option value="${op}|-">${OP_LABEL[op]}</sl-option>`);
  }
  const perTypeOps = OPERATORS.filter(
    ([op]) => !TYPE_AGNOSTIC_OPS.includes(op)
  );
  for (const [valueType, typeLabel] of VALUE_TYPES) {
    parts.push("<sl-divider></sl-divider>");
    parts.push(`<small>${typeLabel}</small>`);
    for (const [op, opLabel] of perTypeOps) {
      parts.push(
        `<sl-option value="${op}|${valueType}">${opLabel} (${typeLabel})</sl-option>`
      );
    }
  }
  return parts.join("");
}

// Maps a stored condition to the combined picker value.
function conditionToOptValue(condition?: Partial<QueryCondition>): string {
  const op = condition?.op ?? "equalTo";
  if (TYPE_AGNOSTIC_OPS.includes(op)) return `${op}|-`;
  return `${op}|${condition?.valueType ?? "str"}`;
}

function createConditionRow(
  container: HTMLElement,
  condition?: Partial<QueryCondition>
): void {
  const row = document.createElement("div");
  row.className = "parse-qb-row";
  row.style.cssText =
    "display:flex;gap:4px;margin-bottom:6px;align-items:center;";
  row.innerHTML = `
    <input type="text" class="qb-field" placeholder="field" style="flex:1.1;min-width:0;height:30px;box-sizing:border-box;" value="${escapeHtml(
      condition?.field ?? ""
    )}">
    <sl-select class="qb-opt" size="small" style="flex:2;min-width:220px;" hoist value="${conditionToOptValue(
      condition
    )}">${combinedOptionsHtml()}</sl-select>
    <sl-input class="qb-value" placeholder="value" size="small" style="flex:1.2;" value="${escapeHtml(
      condition?.value ?? ""
    )}"></sl-input>
    <sl-button class="qb-remove" size="small" title="Remove condition">&#10005;</sl-button>
  `;
  row
    .querySelector(".qb-remove")
    ?.addEventListener("click", () => row.remove());

  // The value input is irrelevant for value-agnostic operators.
  const opt = row.querySelector(".qb-opt") as any;
  const valueInput = row.querySelector(".qb-value") as any;
  const syncValueEnabled = () => {
    const op = String(opt?.value ?? "").split("|")[0];
    if (valueInput) valueInput.disabled = TYPE_AGNOSTIC_OPS.includes(op);
  };
  opt?.addEventListener("sl-change", syncValueEnabled);
  syncValueEnabled();

  container.appendChild(row);

  // Field-name autocomplete from the schema of the selected class.
  attachFieldAutocomplete($(row.querySelector(".qb-field")), "#node-input-className");
}

function collectConditions(container: HTMLElement): QueryCondition[] {
  const conditions: QueryCondition[] = [];
  container.querySelectorAll(".parse-qb-row").forEach((row) => {
    const field = (row.querySelector(".qb-field") as any)?.value ?? "";
    const combined = String(
      (row.querySelector(".qb-opt") as any)?.value ?? "equalTo|str"
    );
    const value = (row.querySelector(".qb-value") as any)?.value ?? "";
    // Combined value is "<op>|<valueType>"; "-" means the datatype is unused.
    const [opPart, typePart] = combined.split("|");
    const op = (opPart || "equalTo") as QueryCondition["op"];
    const valueType = (typePart && typePart !== "-"
      ? typePart
      : "str") as QueryCondition["valueType"];
    if (field !== "") {
      conditions.push({ field, op, value, valueType });
    }
  });
  return conditions;
}

RED.nodes.registerType<OpenincParseQuerybuilderEditorNodeProperties>(
  "openinc-parse-querybuilder",
  {
    category: "parse",
    color: "#61b7f2",
    defaults: {
      name: { value: "" },
      server: { value: "", type: "openinc-parse-config" },
      className: { value: "" },
      conditions: { value: "[]" },
      limit: { value: "" },
      skip: { value: "" },
      order: { value: "" },
      keys: { value: "" },
      include: { value: "" },
      count: { value: false },
    },
    inputs: 1,
    outputs: 1,
    icon: "font-awesome/fa-filter",
    paletteLabel: "parse querybuilder",
    label: function () {
      return (
        this.name ||
        (this.className
          ? `parse query: ${this.className}`
          : "parse querybuilder")
      );
    },
    oneditprepare: function () {
      attachClassAutocomplete("#node-input-className");

      const container = document.getElementById("parse-qb-conditions");
      if (!container) return;
      container.innerHTML = "";

      let conditions: QueryCondition[] = [];
      try {
        conditions = JSON.parse(this.conditions || "[]");
      } catch (error) {
        conditions = [];
      }
      conditions.forEach((condition) =>
        createConditionRow(container, condition)
      );

      document
        .getElementById("parse-qb-add")
        ?.addEventListener("click", () => createConditionRow(container));
    },
    oneditsave: function () {
      const container = document.getElementById("parse-qb-conditions");
      if (!container) return;
      $("#node-input-conditions").val(
        JSON.stringify(collectConditions(container))
      );
    },
  }
);
