import { Node, NodeDef } from "node-red";
import { OpenwareConfigOptions } from "../shared/types";
import { ConfigNode } from "src/nodes/shared/types";

export interface OpenwareConfigNodeDef extends NodeDef, OpenwareConfigOptions {
  host: string;
  port: number;
}

// export interface OpenwareConfigNode extends Node {}
export type OpenwareConfigNode = ConfigNode;
