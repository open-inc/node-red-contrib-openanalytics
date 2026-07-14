import { Node, NodeDef } from "node-red";
import { OpenincParseSubscribeOptions } from "../shared/types";

export interface OpenincParseSubscribeNodeDef
  extends NodeDef,
    OpenincParseSubscribeOptions {}

export type OpenincParseSubscribeNode = Node & {
  unsubscribe?: (() => void) | null;
};
