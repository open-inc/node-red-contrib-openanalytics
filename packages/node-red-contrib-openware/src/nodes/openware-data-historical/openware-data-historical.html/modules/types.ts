import { EditorNodeProperties } from "node-red";
import { OpenwareDataHistoricalOptions } from "../../shared/types";

export interface OpenwareDataHistoricalEditorNodeProperties
  extends EditorNodeProperties,
    OpenwareDataHistoricalOptions {}
