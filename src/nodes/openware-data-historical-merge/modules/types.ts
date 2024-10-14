import { Node, NodeDef } from "node-red";
import { OpenwareDataHistoricalMergeOptions } from "../shared/types";

export interface OpenwareDataHistoricalMergeNodeDef extends NodeDef, OpenwareDataHistoricalMergeOptions {}

// export interface OpenwareDataHistoricalMergeNode extends Node {}
export type OpenwareDataHistoricalMergeNode = Node;
