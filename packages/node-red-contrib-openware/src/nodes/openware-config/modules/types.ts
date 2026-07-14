import { Node, NodeDef } from "node-red";
import { OpenwareConfigOptions } from "../shared/types";
import { ConfigNode } from "../../shared/types";
import { WebSocket } from "ws";

export interface OpenwareConfigNodeDef extends NodeDef, OpenwareConfigOptions {
  host: string;
  port: number;
  websocket: WebSocket;
}

// export interface OpenwareConfigNode extends Node {}
export type OpenwareConfigNode = ConfigNode;
