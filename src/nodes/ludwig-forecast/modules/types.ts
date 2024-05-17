import { Node, NodeDef } from "node-red";
import { LudwigForecastOptions } from "../shared/types";
import { DataPoint, ValueType } from "src/nodes/shared/types";

export interface LudwigForecastNodeDef extends NodeDef, LudwigForecastOptions {}

// export interface LudwigForecastNode extends Node {}
export type LudwigForecastNode = Node;
