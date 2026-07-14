import { Node, NodeDef } from "node-red";
import { OpenwareDataAggregateOptions } from "../shared/types";

export interface OpenwareDataAggregateNodeDef extends NodeDef, OpenwareDataAggregateOptions {}

// export interface OpenwareDataAggregateNode extends Node {}
export type OpenwareDataAggregateNode = Node;
