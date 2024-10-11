import { EditorNodeProperties } from "node-red";
import { OpenwareItemMultipleSelectOptions } from "../../shared/types";

export interface OpenwareItemMultipleSelectEditorNodeProperties
  extends EditorNodeProperties,
    OpenwareItemMultipleSelectOptions {}
