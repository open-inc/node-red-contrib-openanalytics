import { Node, NodeDef } from "node-red";
import { OpenwareItemSelectOptions } from "../shared/types";

export interface OpenwareItemSelectNodeDef extends NodeDef, OpenwareItemSelectOptions {}

// export interface OpenwareItemSelectNode extends Node {}
export type OpenwareItemSelectNode = Node;
