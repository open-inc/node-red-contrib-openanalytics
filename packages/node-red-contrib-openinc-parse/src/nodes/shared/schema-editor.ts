// Editor-only helpers (run in the Node-RED editor, not the runtime). They parse
// a Parse schema — as exported from the dashboard or fetched from /schemas — and
// wire jQuery-UI autocomplete onto class-name / field-name inputs. Other node
// editors read the schema straight off the referenced config node, so no server
// round-trip is needed while editing.

// `RED` is declared per-module in the editor bundles; `$` (jQuery) is global.
declare const RED: any;

export interface ParsedSchema {
  classNames: string[];
  fieldsByClass: Record<string, string[]>;
  // Relation-type fields per class (for relation-key autocomplete).
  relationsByClass: Record<string, string[]>;
}

const EMPTY: ParsedSchema = {
  classNames: [],
  fieldsByClass: {},
  relationsByClass: {},
};

/**
 * Parses a schema JSON string. Accepts the shapes the Parse dashboard / REST
 * API produce: an array of class schemas, `{ results: [...] }`, or a single
 * class object.
 */
export function parseSchema(raw: string | undefined | null): ParsedSchema {
  if (!raw || typeof raw !== "string" || raw.trim() === "") return EMPTY;
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY;
  }

  let classes: any[] = [];
  if (Array.isArray(data)) {
    classes = data;
  } else if (data && Array.isArray(data.results)) {
    classes = data.results;
  } else if (data && typeof data.className === "string") {
    classes = [data];
  } else if (data && typeof data === "object") {
    // Object keyed by class name -> schema.
    classes = Object.keys(data).map((key) =>
      data[key] && data[key].className ? data[key] : { className: key, ...data[key] }
    );
  }

  const result: ParsedSchema = {
    classNames: [],
    fieldsByClass: {},
    relationsByClass: {},
  };
  for (const cls of classes) {
    if (!cls || typeof cls !== "object") continue;
    const name = cls.className;
    if (typeof name !== "string" || name === "") continue;
    if (result.classNames.indexOf(name) === -1) result.classNames.push(name);
    const fields =
      cls.fields && typeof cls.fields === "object" ? cls.fields : {};
    const fieldNames = Object.keys(fields);
    result.fieldsByClass[name] = fieldNames;
    result.relationsByClass[name] = fieldNames.filter(
      (field) => fields[field] && fields[field].type === "Relation"
    );
  }
  result.classNames.sort();
  return result;
}

/** Parsed schema of the referenced config node (by its node id). */
export function schemaForServer(
  serverId: string | undefined | null
): ParsedSchema {
  if (!serverId) return EMPTY;
  const cfg = RED.nodes.node(serverId);
  return parseSchema(cfg && cfg.schema);
}

/** Short human summary, e.g. "12 classes, 84 fields". */
export function schemaSummary(raw: string | undefined | null): string {
  const schema = parseSchema(raw);
  if (schema.classNames.length === 0) return "";
  const fieldCount = Object.keys(schema.fieldsByClass).reduce(
    (sum, cls) => sum + schema.fieldsByClass[cls].length,
    0
  );
  return `${schema.classNames.length} classes, ${fieldCount} fields`;
}

let datalistCounter = 0;

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * Attaches suggestions to a text input via a native <datalist>. `sourceFn` is
 * re-evaluated on focus/input so the options can depend on other live fields
 * (e.g. the class currently typed). Native datalists work in every browser and
 * need no editor framework support.
 */
export function attachAutocomplete(
  input: any,
  sourceFn: () => string[]
): void {
  const el: HTMLInputElement | null =
    input && input.jquery ? input[0] : input || null;
  if (!el || !el.parentNode) return;

  let listId = el.getAttribute("list") || "";
  let datalist = listId
    ? (document.getElementById(listId) as HTMLDataListElement | null)
    : null;
  if (!datalist) {
    listId = "openinc-parse-dl-" + ++datalistCounter;
    datalist = document.createElement("datalist");
    datalist.id = listId;
    el.setAttribute("list", listId);
    el.parentNode.appendChild(datalist);
  }

  const refresh = () => {
    const items = sourceFn() || [];
    (datalist as HTMLDataListElement).innerHTML = items
      .map((item) => `<option value="${escapeAttr(String(item))}"></option>`)
      .join("");
  };
  el.addEventListener("focus", refresh);
  el.addEventListener("input", refresh);
  refresh();
}

/** Class-name autocomplete sourced from the node's server (config) field. */
export function attachClassAutocomplete(
  inputSelector: string,
  serverSelector = "#node-input-server"
): void {
  attachAutocomplete($(inputSelector), () =>
    schemaForServer($(serverSelector).val() as string).classNames
  );
}

/**
 * Field-name autocomplete for `input`, suggesting fields of the class named in
 * `classSelector`; falls back to the union of all fields when no (matching)
 * class is set.
 */
export function attachFieldAutocomplete(
  input: any,
  classSelector: string,
  serverSelector = "#node-input-server"
): void {
  attachAutocomplete(input, () => {
    const schema = schemaForServer($(serverSelector).val() as string);
    const cls = String($(classSelector).val() || "");
    const fields = schema.fieldsByClass[cls];
    if (fields && fields.length) return fields;
    const all: string[] = [];
    Object.keys(schema.fieldsByClass).forEach((c) =>
      schema.fieldsByClass[c].forEach((f) => {
        if (all.indexOf(f) === -1) all.push(f);
      })
    );
    return all.sort();
  });
}

/**
 * Relation-key autocomplete: relation-type fields of the class in
 * `classSelector`, falling back to all relation fields across classes.
 */
export function attachRelationKeyAutocomplete(
  input: any,
  classSelector: string,
  serverSelector = "#node-input-server"
): void {
  attachAutocomplete(input, () => {
    const schema = schemaForServer($(serverSelector).val() as string);
    const cls = String($(classSelector).val() || "");
    const rels = schema.relationsByClass[cls];
    if (rels && rels.length) return rels;
    const all: string[] = [];
    Object.keys(schema.relationsByClass).forEach((c) =>
      schema.relationsByClass[c].forEach((f) => {
        if (all.indexOf(f) === -1) all.push(f);
      })
    );
    return all.sort();
  });
}
