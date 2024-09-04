import { Node, NodeDef, NodeMessage } from "node-red";
import { OpenwareSourcesOptions } from "../shared/types";
import { errorType, SourceMessage } from "src/nodes/shared/types";

export interface OpenwareSourcesNodeDef
  extends NodeDef,
    OpenwareSourcesOptions {}

export interface OpenwareSourcesNode extends Node {
  send(msg: SourceMessage): void;
}
//export type OpenwareSourcesNode = Node;
