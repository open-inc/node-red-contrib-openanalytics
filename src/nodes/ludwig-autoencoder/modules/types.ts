import { Node, NodeDef } from "node-red";
import { LudwigAutoencoderOptions } from "../shared/types";

export interface LudwigAutoencoderNodeDef extends NodeDef, LudwigAutoencoderOptions {}

// export interface LudwigAutoencoderNode extends Node {}
export type LudwigAutoencoderNode = Node;
