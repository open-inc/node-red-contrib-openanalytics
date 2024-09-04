import { Node, NodeDef } from "node-red";
import { OpenwareSubscriptionOptions } from "../shared/types";

export interface OpenwareSubscriptionNodeDef extends NodeDef, OpenwareSubscriptionOptions {}

// export interface OpenwareSubscriptionNode extends Node {}
export type OpenwareSubscriptionNode = Node;
