import { Node, NodeDef } from "node-red";
import { OpenwareDataHistoricalOptions } from "../shared/types";

export interface OpenwareDataHistoricalNodeDef extends NodeDef, OpenwareDataHistoricalOptions {}

// export interface OpenwareDataHistoricalNode extends Node {}
export type OpenwareDataHistoricalNode = Node;
