import { Node, NodeDef } from "node-red";
import { OpenincParseSaveOptions } from "../shared/types";

export interface OpenincParseSaveNodeDef
  extends NodeDef,
    OpenincParseSaveOptions {}

export type OpenincParseSaveNode = Node;
