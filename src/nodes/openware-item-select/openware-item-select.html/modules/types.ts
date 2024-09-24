import { EditorNodeProperties } from "node-red";
import { OpenwareItemSelectOptions } from "../../shared/types";

export interface OpenwareItemSelectEditorNodeProperties
  extends EditorNodeProperties,
    OpenwareItemSelectOptions {}
