import { Node, NodeDef } from "node-red";
import { OpenwareVirtualSensorOptions } from "../shared/types";

export interface OpenwareVirtualSensorNodeDef
  extends NodeDef, OpenwareVirtualSensorOptions {}

// export interface OpenwareVirtualSensorNode extends Node {}
export type OpenwareVirtualSensorNode = Node;
