import { Node, NodeDef } from "node-red";
import { OpenwareDataLiveOptions } from "../shared/types";

export interface OpenwareDataLiveNodeDef extends NodeDef, OpenwareDataLiveOptions {}

// export interface OpenwareDataLiveNode extends Node {}
export type OpenwareDataLiveNode = Node;
