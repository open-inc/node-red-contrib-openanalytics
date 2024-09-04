import { EditorNodeProperties } from "node-red";
import { OpenwareDataAggregateOptions } from "../../shared/types";

export interface OpenwareDataAggregateEditorNodeProperties
  extends EditorNodeProperties,
    OpenwareDataAggregateOptions {}
