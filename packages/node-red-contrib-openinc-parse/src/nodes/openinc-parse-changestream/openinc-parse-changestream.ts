import { NodeInitializer } from "node-red";
import {
  OpenincParseChangestreamNode,
  OpenincParseChangestreamNodeDef,
} from "./modules/types";
import { ChangelogEntry, ChangestreamMsgType } from "./shared/types";
import { ParseConfigNode } from "../shared/types";

const CHANGELOG_CLASS = "OD3_Changelog";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenincParseChangestreamNodeConstructor(
    this: OpenincParseChangestreamNode,
    config: OpenincParseChangestreamNodeDef
  ): void {
    RED.nodes.createNode(this, config);
    const node = this;
    const server = RED.nodes.getNode(config.server) as ParseConfigNode | null;

    if (!server) {
      node.status({
        fill: "red",
        shape: "ring",
        text: "Select a Parse Server configuration.",
      });
      return;
    }

    const intervalMs =
      Math.max(1, parseInt(config.interval, 10) || 10) * 1000;
    const limit = Math.max(1, parseInt(config.limit, 10) || 100);

    const whereBase: Record<string, any> = {};
    if (config.className) {
      whereBase.nameOfClass = config.className;
    }
    if (config.operations) {
      const operations = config.operations
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry !== "");
      if (operations.length === 1) {
        whereBase.operation = operations[0];
      } else if (operations.length > 1) {
        whereBase.operation = { $in: operations };
      }
    }

    // Keyset cursor over (createdAt, objectId). Paging strictly "after" this
    // compound key makes pagination deterministic even when many entries share
    // a createdAt timestamp — no entry is ever emitted twice and the loop
    // always advances.
    let cursorCreatedAt: string | null = null;
    let cursorObjectId: string | null = null;
    let polling = false;
    let timer: NodeJS.Timeout | null = null;

    const emitEntry = (entry: ChangelogEntry) => {
      node.send({
        payload: {
          event: entry.operation,
          className: entry.nameOfClass,
          objectId: entry.changedObject,
          value: entry.value,
          original: entry.original,
          actingUser: entry.actingUser,
          changelog: entry,
        },
      } as ChangestreamMsgType);
    };

    // Seed the cursor without hitting the server. "Emit existing" starts from
    // the epoch (dumps the whole changelog once); otherwise start from now so
    // only entries created after deploy are emitted. This avoids an expensive
    // "-createdAt" scan that some Parse deployments reject with a 500.
    const initCursor = () => {
      cursorCreatedAt = config.emitExisting
        ? new Date(0).toISOString()
        : new Date().toISOString();
      cursorObjectId = null;
    };

    const poll = async () => {
      if (polling) return;
      polling = true;
      try {
        if (cursorCreatedAt === null) initCursor();

        let more = true;
        while (more) {
          // First page (no objectId yet) is an inclusive lower bound; after
          // that, page strictly after the last (createdAt, objectId) key.
          const afterClause =
            cursorObjectId === null
              ? {
                  createdAt: { $gte: { __type: "Date", iso: cursorCreatedAt } },
                }
              : {
                  $or: [
                    {
                      createdAt: { $gt: { __type: "Date", iso: cursorCreatedAt } },
                    },
                    {
                      createdAt: { __type: "Date", iso: cursorCreatedAt },
                      objectId: { $gt: cursorObjectId },
                    },
                  ],
                };

          const result = await server.api.find({
            className: CHANGELOG_CLASS,
            where: { ...whereBase, ...afterClause },
            order: "createdAt,objectId",
            limit,
          });
          if (result.status === "error") {
            node.status({
              fill: "red",
              shape: "dot",
              text: "Error: " + (result.payload.error ?? "unknown"),
            });
            node.error(result.payload);
            return;
          }

          const results = (result.payload.results ?? []) as ChangelogEntry[];
          results.forEach(emitEntry);

          if (results.length > 0) {
            const last = results[results.length - 1];
            cursorCreatedAt = last.createdAt;
            cursorObjectId = last.objectId;
            node.status({
              fill: "green",
              shape: "dot",
              text: `${results.length} changes @ ${new Date().toLocaleTimeString()}`,
            });
          } else {
            node.status({ fill: "green", shape: "ring", text: "watching" });
          }

          // A full page means there may be more entries waiting.
          more = results.length >= limit;
        }
      } finally {
        polling = false;
      }
    };

    timer = setInterval(poll, intervalMs);
    poll();

    // Any input triggers an immediate poll (e.g. to reduce latency after
    // own writes).
    node.on("input", function (_msg, _send, done) {
      poll().then(() => done());
    });

    node.on("close", function () {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    });
  }

  RED.nodes.registerType(
    "openinc-parse-changestream",
    OpenincParseChangestreamNodeConstructor
  );
};

export = nodeInit;
