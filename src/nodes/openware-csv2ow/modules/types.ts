import { Node, NodeDef } from "node-red";
import { OpenwareCsv2owOptions } from "../shared/types";

export interface OpenwareCsv2owNodeDef extends NodeDef, OpenwareCsv2owOptions {}

// export interface OpenwareCsv2owNode extends Node {}
export type OpenwareCsv2owNode = Node;
