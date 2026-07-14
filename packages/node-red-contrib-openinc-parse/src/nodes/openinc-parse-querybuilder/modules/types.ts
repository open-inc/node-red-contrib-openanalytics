import { Node, NodeDef } from "node-red";
import { OpenincParseQuerybuilderOptions } from "../shared/types";

export interface OpenincParseQuerybuilderNodeDef
  extends NodeDef,
    OpenincParseQuerybuilderOptions {}

export type OpenincParseQuerybuilderNode = Node;
