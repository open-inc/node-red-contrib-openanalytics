import { Node, NodeDef } from "node-red";
import { OpenwareDataSendOptions } from "../shared/types";

export interface OpenwareDataSendNodeDef extends NodeDef, OpenwareDataSendOptions {}

// export interface OpenwareDataSendNode extends Node {}
export type OpenwareDataSendNode = Node;
