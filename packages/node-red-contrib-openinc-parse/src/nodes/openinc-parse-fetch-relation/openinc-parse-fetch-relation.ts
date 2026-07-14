import { NodeInitializer } from "node-red";
import {
  OpenincParseFetchRelationNode,
  OpenincParseFetchRelationNodeDef,
} from "./modules/types";
import { FetchRelationMsgType } from "./shared/types";
import { ParseConfigNode, ParseQuery } from "../shared/types";

/**
 * Reads the target class name of a Parse Relation field value, i.e. a value
 * shaped like { __type: "Relation", className: "Something" }. Returns undefined
 * for anything else.
 */
function relationTargetClass(value: unknown): string | undefined {
  if (value && typeof value === "object") {
    const rel = value as Record<string, any>;
    if (rel.__type === "Relation" && typeof rel.className === "string") {
      return rel.className;
    }
  }
  return undefined;
}

const nodeInit: NodeInitializer = (RED): void => {
  function OpenincParseFetchRelationNodeConstructor(
    this: OpenincParseFetchRelationNode,
    config: OpenincParseFetchRelationNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    const node = this;
    const server = RED.nodes.getNode(config.server) as ParseConfigNode | null;

    node.on("input", async function (msg: FetchRelationMsgType, send, done) {
      if (!server) {
        node.status({
          fill: "red",
          shape: "ring",
          text: "Select a Parse Server configuration.",
        });
        done();
        return;
      }

      const fail = (text: string, logMsg?: string) => {
        node.status({ fill: "red", shape: "dot", text });
        node.error(logMsg ?? text, msg);
        done();
      };

      // Relation key: msg.relationKey wins over the configured default.
      const relationKey =
        (typeof msg.relationKey === "string" && msg.relationKey) ||
        config.relationKey;
      if (!relationKey) {
        fail(
          "No relationKey",
          "No relation key configured and none provided in msg.relationKey"
        );
        return;
      }

      // Identify the parent object and (if possible) the relation target class.
      let parentClassName: string | undefined;
      let parentObjectId: string | undefined;
      let targetClassName: string | undefined =
        config.targetClassName || undefined;

      if (config.source === "payload") {
        const payload = msg.payload;
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
          fail(
            "payload not an object",
            "source is 'payload' but msg.payload is not a single Parse object"
          );
          return;
        }
        parentClassName = payload.className;
        parentObjectId = payload.objectId;
        // A relation field on a fetched object carries its own target class.
        targetClassName =
          targetClassName ?? relationTargetClass(payload[relationKey]);
      } else {
        // "config" — parent identified by the node settings (msg may override).
        parentClassName =
          config.className ||
          (typeof msg.className === "string" ? msg.className : undefined);
        parentObjectId =
          config.objectId ||
          (typeof msg.objectId === "string" ? msg.objectId : undefined);
      }

      if (!parentClassName || !parentObjectId) {
        fail(
          "No parent class/id",
          "Could not determine the parent object's className and objectId"
        );
        return;
      }

      node.status({ fill: "blue", shape: "dot", text: "resolving..." });

      // If we still don't know the target class, fetch the parent object and
      // read it off the relation field itself.
      if (!targetClassName) {
        const parent = await server.api.request(
          "GET",
          `/classes/${parentClassName}/${parentObjectId}`
        );
        if (parent.status === "error") {
          fail(
            "Error: " + (parent.payload.error ?? "unknown"),
            "Failed to fetch parent object to detect relation target class"
          );
          node.error(parent.payload, msg);
          return;
        }
        targetClassName = relationTargetClass(parent.payload?.[relationKey]);
      }

      if (!targetClassName) {
        fail(
          "Unknown target class",
          `Could not determine the target class of relation "${relationKey}". ` +
            "Set the Target Class field, or feed an object whose relation field is populated."
        );
        return;
      }

      // A $relatedTo query returns the members of the relation.
      const query: ParseQuery = {
        className: targetClassName,
        where: {
          $relatedTo: {
            object: {
              __type: "Pointer",
              className: parentClassName,
              objectId: parentObjectId,
            },
            key: relationKey,
          },
        },
      };

      if (config.limit !== "") {
        const limit = parseInt(config.limit, 10);
        if (!isNaN(limit)) query.limit = limit;
      }
      if (config.order !== "") {
        query.order = config.order;
      }

      node.status({ fill: "blue", shape: "dot", text: "querying..." });

      const result = await server.api.find(query);

      if (result.status === "error") {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Error: " + (result.payload.error ?? "unknown"),
        });
        node.error(result.payload, msg);
        done();
        return;
      }

      node.status({
        fill: "green",
        shape: "dot",
        text: `${result.payload.results?.length ?? 0} results`,
      });

      send({
        ...msg,
        payload: result.payload.results,
        count: result.payload.count,
        query,
        parent: { className: parentClassName, objectId: parentObjectId },
      } as FetchRelationMsgType);
      done();
    });
  }

  RED.nodes.registerType(
    "openinc-parse-fetch-relation",
    OpenincParseFetchRelationNodeConstructor
  );
};

export = nodeInit;
