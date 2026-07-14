import { Node, NodeDef } from "node-red";
import { OpenwareSubscriptionOptions } from "../shared/types";
import WebSocket = require("ws");
export interface OpenwareSubscriptionNodeDef
  extends NodeDef,
    OpenwareSubscriptionOptions {}

// export interface OpenwareSubscriptionNode extends Node {}
export type OpenwareSubscriptionNode = Node & {
  unsubscribe: () => void | null;
  filter: Set<string>;
};
