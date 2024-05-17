import { Node, NodeDef } from "node-red";
import { LudwigPredictOptions } from "../shared/types";

export interface LudwigPredictNodeDef extends NodeDef, LudwigPredictOptions {
  modelname: string;
  modelversion: string;
}

// export interface LudwigPredictNode extends Node {}
export type LudwigPredictNode = Node;
