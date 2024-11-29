import { EditorNodeProperties } from "node-red";
import { OpenwareDataPcaOptions } from "../../shared/types";

export interface OpenwareDataPcaEditorNodeProperties
  extends EditorNodeProperties,
    OpenwareDataPcaOptions {}
