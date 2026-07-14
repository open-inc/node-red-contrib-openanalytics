import { NodeInitializer, NodeMessage } from "node-red";
import {
  OpenincParseQuerybuilderNode,
  OpenincParseQuerybuilderNodeDef,
} from "./modules/types";
import { QueryCondition, QuerybuilderMsgType } from "./shared/types";
import { ParseQuery } from "../shared/types";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const nodeInit: NodeInitializer = (RED): void => {
  function coerceValue(
    condition: QueryCondition,
    msg: NodeMessage
  ): any {
    const raw = condition.value;
    switch (condition.valueType) {
      case "num":
        return Number(raw);
      case "bool":
        return raw === "true" || raw === "1";
      case "json":
        return JSON.parse(raw);
      case "date":
        return { __type: "Date", iso: new Date(raw).toISOString() };
      case "pointer": {
        const [className, objectId] = raw.split(":");
        return { __type: "Pointer", className, objectId };
      }
      case "msg":
        return RED.util.getMessageProperty(msg as any, raw);
      case "str":
      default:
        return raw;
    }
  }

  function applyCondition(
    where: Record<string, any>,
    condition: QueryCondition,
    msg: NodeMessage
  ): void {
    const field = condition.field;
    if (!field) return;

    if (condition.op === "exists") {
      where[field] = { ...where[field], $exists: true };
      return;
    }
    if (condition.op === "doesNotExist") {
      where[field] = { ...where[field], $exists: false };
      return;
    }

    const value = coerceValue(condition, msg);

    const setConstraint = (key: string, constraint: any) => {
      if (
        where[field] &&
        typeof where[field] === "object" &&
        !Array.isArray(where[field]) &&
        !("__type" in where[field])
      ) {
        where[field][key] = constraint;
      } else {
        where[field] = { [key]: constraint };
      }
    };

    const asArray = Array.isArray(value)
      ? value
      : String(value)
          .split(",")
          .map((entry) => entry.trim());

    switch (condition.op) {
      case "equalTo":
        where[field] = value;
        break;
      case "notEqualTo":
        setConstraint("$ne", value);
        break;
      case "greaterThan":
        setConstraint("$gt", value);
        break;
      case "greaterThanOrEqualTo":
        setConstraint("$gte", value);
        break;
      case "lessThan":
        setConstraint("$lt", value);
        break;
      case "lessThanOrEqualTo":
        setConstraint("$lte", value);
        break;
      case "containedIn":
        setConstraint("$in", asArray);
        break;
      case "notContainedIn":
        setConstraint("$nin", asArray);
        break;
      case "contains":
        setConstraint("$regex", escapeRegex(String(value)));
        break;
      case "startsWith":
        setConstraint("$regex", "^" + escapeRegex(String(value)));
        break;
      case "matchesRegex":
        setConstraint("$regex", String(value));
        break;
    }
  }

  function OpenincParseQuerybuilderNodeConstructor(
    this: OpenincParseQuerybuilderNode,
    config: OpenincParseQuerybuilderNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    const node = this;

    let conditions: QueryCondition[] = [];
    try {
      conditions = JSON.parse(config.conditions || "[]");
    } catch (error) {
      node.error("Invalid conditions configuration: " + String(error));
    }

    node.on("input", function (msg: QuerybuilderMsgType, send, done) {
      let where: Record<string, any> = {};

      try {
        for (const condition of conditions) {
          applyCondition(where, condition, msg);
        }
      } catch (error) {
        node.status({ fill: "red", shape: "dot", text: String(error) });
        node.error("Failed to build query: " + String(error), msg);
        done();
        return;
      }

      // Merge an incoming where (e.g. from a chained querybuilder) via $and.
      const incoming = msg.payload;
      if (
        incoming &&
        typeof incoming === "object" &&
        incoming.where &&
        typeof incoming.where === "object" &&
        Object.keys(incoming.where).length > 0
      ) {
        where =
          Object.keys(where).length > 0
            ? { $and: [incoming.where, where] }
            : incoming.where;
      }

      const query: ParseQuery = { className: config.className };
      if (Object.keys(where).length > 0) query.where = where;

      const limit = parseInt(config.limit, 10);
      if (!isNaN(limit)) query.limit = limit;
      const skip = parseInt(config.skip, 10);
      if (!isNaN(skip)) query.skip = skip;
      if (config.order) query.order = config.order;
      if (config.keys) query.keys = config.keys;
      if (config.include) query.include = config.include;
      if (config.count) query.count = true;

      node.status({});
      send({ ...msg, payload: query } as QuerybuilderMsgType);
      done();
    });
  }

  RED.nodes.registerType(
    "openinc-parse-querybuilder",
    OpenincParseQuerybuilderNodeConstructor
  );
};

export = nodeInit;
