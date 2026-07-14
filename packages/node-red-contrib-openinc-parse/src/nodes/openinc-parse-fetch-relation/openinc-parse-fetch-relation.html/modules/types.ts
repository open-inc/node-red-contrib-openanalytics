import { EditorNodeProperties } from "node-red";
import { OpenincParseFetchRelationOptions } from "../../shared/types";

export interface OpenincParseFetchRelationEditorNodeProperties
  extends EditorNodeProperties,
    OpenincParseFetchRelationOptions {}
