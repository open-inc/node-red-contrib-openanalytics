import { EditorNodeProperties } from "node-red";
import { OpenincParseQuerybuilderOptions } from "../../shared/types";

export interface OpenincParseQuerybuilderEditorNodeProperties
  extends EditorNodeProperties,
    OpenincParseQuerybuilderOptions {}
