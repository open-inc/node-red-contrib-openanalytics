import { EditorNodeProperties } from "node-red";
import { OpenincParseConfigOptions } from "../../shared/types";

export interface OpenincParseConfigEditorNodeProperties
  extends EditorNodeProperties,
    OpenincParseConfigOptions {}
