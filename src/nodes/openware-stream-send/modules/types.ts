import { Node, NodeDef } from "node-red";
import { OpenwareStreamSendOptions } from "../shared/types";
import WebSocket = require("ws");
export interface OpenwareStreamSendNodeDef
  extends NodeDef,
    OpenwareStreamSendOptions {}

// export interface OpenwareStreamSendNode extends Node {}
export type OpenwareStreamSendNode = Node & {
  webSocket: WebSocket | undefined;
  wsConnecting: NodeJS.Timeout | undefined;
  plannedClose: boolean;
};
