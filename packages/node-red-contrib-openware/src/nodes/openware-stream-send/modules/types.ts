import { Node, NodeDef } from "node-red";
import { OpenwareStreamSendOptions } from "../shared/types";

export interface OpenwareStreamSendNodeDef
  extends NodeDef,
    OpenwareStreamSendOptions {}

export type OpenwareStreamSendNode = Node;
