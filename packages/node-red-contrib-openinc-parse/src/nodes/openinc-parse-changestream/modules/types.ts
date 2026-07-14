import { Node, NodeDef } from "node-red";
import { OpenincParseChangestreamOptions } from "../shared/types";

export interface OpenincParseChangestreamNodeDef
  extends NodeDef,
    OpenincParseChangestreamOptions {}

export type OpenincParseChangestreamNode = Node;
