import { Node, NodeDef } from "node-red";
import { OpenwareItemsOptions } from "../shared/types";

export interface OpenwareItemsNodeDef extends NodeDef, OpenwareItemsOptions {}

// export interface OpenwareItemsNode extends Node {}
export type OpenwareItemsNode = Node;
