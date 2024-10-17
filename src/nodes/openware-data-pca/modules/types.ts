import { Node, NodeDef } from "node-red";
import { OpenwareDataPcaOptions } from "../shared/types";

export interface OpenwareDataPcaNodeDef extends NodeDef, OpenwareDataPcaOptions {}

// export interface OpenwareDataPcaNode extends Node {}
export type OpenwareDataPcaNode = Node;
