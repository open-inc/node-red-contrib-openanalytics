import { EditorNodeProperties } from "node-red";
import { OpenincParseSaveOptions } from "../../shared/types";

export interface OpenincParseSaveEditorNodeProperties
  extends EditorNodeProperties,
    OpenincParseSaveOptions {}
