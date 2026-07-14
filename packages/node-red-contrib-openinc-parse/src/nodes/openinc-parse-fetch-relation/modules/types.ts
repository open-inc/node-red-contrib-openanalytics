import { Node, NodeDef } from "node-red";
import { OpenincParseFetchRelationOptions } from "../shared/types";

export interface OpenincParseFetchRelationNodeDef
  extends NodeDef,
    OpenincParseFetchRelationOptions {}

export type OpenincParseFetchRelationNode = Node;
