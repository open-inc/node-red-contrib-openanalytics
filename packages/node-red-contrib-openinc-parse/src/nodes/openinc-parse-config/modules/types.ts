import { NodeDef } from "node-red";
import { OpenincParseConfigOptions } from "../shared/types";
import { ParseConfigNode } from "../../shared/types";

export interface OpenincParseConfigNodeDef
  extends NodeDef,
    OpenincParseConfigOptions {}

export type OpenincParseConfigNode = ParseConfigNode;
