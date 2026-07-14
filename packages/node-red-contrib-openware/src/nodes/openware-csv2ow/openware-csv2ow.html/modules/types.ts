import { EditorNodeProperties } from "node-red";
import { OpenwareCsv2owOptions } from "../../shared/types";

export interface OpenwareCsv2owEditorNodeProperties
  extends EditorNodeProperties,
    OpenwareCsv2owOptions {}
