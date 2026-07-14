import { EditorNodeProperties } from "node-red";
import { OpenincParseFindOptions } from "../../shared/types";

export interface OpenincParseFindEditorNodeProperties
  extends EditorNodeProperties,
    OpenincParseFindOptions {}
