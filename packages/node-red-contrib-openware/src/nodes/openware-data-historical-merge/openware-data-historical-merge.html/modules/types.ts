import { EditorNodeProperties } from "node-red";
import { OpenwareDataHistoricalMergeOptions } from "../../shared/types";

export interface OpenwareDataHistoricalMergeEditorNodeProperties
  extends EditorNodeProperties,
    OpenwareDataHistoricalMergeOptions {}
