import { NodeInitializer } from "node-red";
import {
  OpenincParseSubscribeNode,
  OpenincParseSubscribeNodeDef,
} from "./modules/types";
import { SubscribeMsgType } from "./shared/types";
import { ParseConfigNode, ParseQuery } from "../shared/types";
import { subscribeLiveQuery } from "../shared/livequery";
import { resolveQuery } from "../shared/helper";

const nodeInit: NodeInitializer = (RED): void => {
  function OpenincParseSubscribeNodeConstructor(
    this: OpenincParseSubscribeNode,
    config: OpenincParseSubscribeNodeDef
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

    const startSubscription = (query: ParseQuery) => {
      if (node.unsubscribe) {
        node.unsubscribe();
        node.unsubscribe = null;
      }
      if (!query.className) {
        node.status({ fill: "red", shape: "dot", text: "No className" });
        return;
      }
      node.unsubscribe = subscribeLiveQuery(server, {
        className: query.className,
        where: query.where,
        onEvent: (event, data) => {
          node.send([
            {
              payload: {
                event,
                object: data.object,
                original: data.original,
                className: query.className,
              },
            },
            null,
          ]);
        },
        onStatus: (status) => {
          node.status(status);
          node.send([
            null,
            {
              payload: {
                connected: status.fill === "green",
                status: status.text,
              },
            },
          ]);
        },
      });
    };

    // Subscribe on deploy when a class is configured.
    if (config.className) {
      let where: Record<string, any> | undefined;
      try {
        where = config.where ? JSON.parse(config.where) : undefined;
      } catch (error) {
        node.status({ fill: "red", shape: "dot", text: "Invalid where JSON" });
        node.error("Invalid where JSON in node configuration");
        return;
      }
      startSubscription({ className: config.className, where });
    } else {
      node.status({
        fill: "yellow",
        shape: "ring",
        text: "Not subscribed (send a query).",
      });
    }

    node.on("input", function (msg: SubscribeMsgType) {
      if (msg.disconnect) {
        if (node.unsubscribe) {
          node.unsubscribe();
          node.unsubscribe = null;
        }
        node.status({ fill: "yellow", shape: "ring", text: "Unsubscribed." });
        return;
      }

      const query = resolveQuery(msg.payload, config.className);
      if (!query.className) {
        node.status({
          fill: "red",
          shape: "dot",
          text: "No className in settings or msg.payload",
        });
        return;
      }
      startSubscription(query);
    });

    node.on("close", function () {
      if (node.unsubscribe) {
        node.unsubscribe();
        node.unsubscribe = null;
      }
    });
  }

  RED.nodes.registerType(
    "openinc-parse-subscribe",
    OpenincParseSubscribeNodeConstructor
  );
};

export = nodeInit;
