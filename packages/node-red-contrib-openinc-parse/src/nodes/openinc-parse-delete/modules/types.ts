import { Node, NodeDef } from "node-red";
import { OpenincParseDeleteOptions } from "../shared/types";

export interface OpenincParseDeleteNodeDef
  extends NodeDef,
    OpenincParseDeleteOptions {}

export type OpenincParseDeleteNode = Node;
