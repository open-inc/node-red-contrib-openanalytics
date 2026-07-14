import { EditorNodeProperties } from "node-red";
import { OpenincParseDeleteOptions } from "../../shared/types";

export interface OpenincParseDeleteEditorNodeProperties
  extends EditorNodeProperties,
    OpenincParseDeleteOptions {}
