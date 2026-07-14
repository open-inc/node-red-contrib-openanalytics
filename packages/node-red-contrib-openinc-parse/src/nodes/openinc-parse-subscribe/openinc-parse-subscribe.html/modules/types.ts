import { EditorNodeProperties } from "node-red";
import { OpenincParseSubscribeOptions } from "../../shared/types";

export interface OpenincParseSubscribeEditorNodeProperties
  extends EditorNodeProperties,
    OpenincParseSubscribeOptions {}
