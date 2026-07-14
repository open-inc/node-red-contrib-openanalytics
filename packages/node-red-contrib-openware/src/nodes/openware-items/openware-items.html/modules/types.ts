import { EditorNodeProperties } from "node-red";
import { OpenwareItemsOptions } from "../../shared/types";

export interface OpenwareItemsEditorNodeProperties
  extends EditorNodeProperties,
    OpenwareItemsOptions {}
