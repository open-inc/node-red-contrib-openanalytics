import { Node, NodeDef } from "node-red";
import { OpenwareItemMultipleSelectOptions } from "../shared/types";

export interface OpenwareItemMultipleSelectNodeDef extends NodeDef, OpenwareItemMultipleSelectOptions {}

// export interface OpenwareItemMultipleSelectNode extends Node {}
export type OpenwareItemMultipleSelectNode = Node;
