import { NodeInitializer } from "node-red";
import { OpenwareCsv2owNode, OpenwareCsv2owNodeDef } from "./modules/types";
import { OWItemType, ValueType } from "../shared/types";

function splitCsvLine(line: string, delimiter: string): string[] {
  // RFC4180-lite: handles quoted strings with embedded delimiters and "" escapes
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}

function coerceValue(raw: string, valueType: ValueType | undefined): unknown {
  const t = (valueType?.type || "").toLowerCase();
  if (raw === "" || raw === undefined) return null;
  switch (t) {
    case "string":
      return raw;
    case "boolean":
      return raw === "true" || raw === "1";
    case "number": {
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    }
    case "geo":
    case "object":
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    default: {
      const n = Number(raw);
      return Number.isFinite(n) && raw.trim() !== "" ? n : raw;
    }
  }
}

const nodeInit: NodeInitializer = (RED): void => {
  function OpenwareCsv2owNodeConstructor(
    this: OpenwareCsv2owNode,
    config: OpenwareCsv2owNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    const node = this;

    this.on("input", (msg: any, send, done) => {
      const delimiter =
        (typeof msg.delimiter === "string" && msg.delimiter) ||
        config.delimiter ||
        ",";

      if (typeof msg.payload !== "string") {
        node.error(
          { error: "msg.payload must be a CSV string with a JSON header line" },
          msg
        );
        done();
        return;
      }

      const lines = msg.payload.split(/\r?\n/);
      if (lines.length < 1 || !lines[0].trim()) {
        node.error({ error: "Empty CSV input" }, msg);
        done();
        return;
      }

      let meta: Partial<OWItemType>;
      try {
        meta = JSON.parse(lines[0]);
      } catch (e) {
        node.error(
          { error: "First line is not valid JSON metadata", details: String(e) },
          msg
        );
        done();
        return;
      }

      if (!meta.name || !meta.source || !meta.id || !meta.valueTypes) {
        node.error(
          {
            error:
              "JSON metadata header must include name, source, id and valueTypes",
          },
          msg
        );
        done();
        return;
      }

      const valueTypes = meta.valueTypes;
      const values: OWItemType["values"] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || !line.trim()) continue;
        const cols = splitCsvLine(line, delimiter);
        const dateStr = cols[0];
        const date = Number(dateStr);
        if (!Number.isFinite(date)) {
          node.warn(`csv2ow: skipping line ${i + 1}, invalid date "${dateStr}"`);
          continue;
        }
        const value = cols
          .slice(1)
          .map((raw, idx) => coerceValue(raw, valueTypes[idx]));
        values.push({ date, value });
      }

      const owItem: OWItemType = {
        name: meta.name,
        source: meta.source,
        id: meta.id,
        type: meta.type ?? "number",
        valueTypes,
        values,
      };

      send({ ...msg, payload: owItem });
      done();
    });
  }

  RED.nodes.registerType("openware-csv2ow", OpenwareCsv2owNodeConstructor);
};

export = nodeInit;
