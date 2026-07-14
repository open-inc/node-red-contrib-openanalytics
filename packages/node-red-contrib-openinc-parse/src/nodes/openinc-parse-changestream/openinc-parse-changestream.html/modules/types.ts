import { EditorNodeProperties } from "node-red";
import { OpenincParseChangestreamOptions } from "../../shared/types";

export interface OpenincParseChangestreamEditorNodeProperties
  extends EditorNodeProperties,
    OpenincParseChangestreamOptions {}
