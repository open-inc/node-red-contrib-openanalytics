import { Node, NodeDef } from "node-red";
import { OpenincParseFindOptions } from "../shared/types";

export interface OpenincParseFindNodeDef
  extends NodeDef,
    OpenincParseFindOptions {}

export type OpenincParseFindNode = Node;
