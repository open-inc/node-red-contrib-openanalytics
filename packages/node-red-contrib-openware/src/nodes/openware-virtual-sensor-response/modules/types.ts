import { Node, NodeDef } from "node-red";
import { OpenwareVirtualSensorResponseOptions } from "../shared/types";

export interface OpenwareVirtualSensorResponseNodeDef
  extends NodeDef, OpenwareVirtualSensorResponseOptions {}

// export interface OpenwareVirtualSensorResponseNode extends Node {}
export type OpenwareVirtualSensorResponseNode = Node;
