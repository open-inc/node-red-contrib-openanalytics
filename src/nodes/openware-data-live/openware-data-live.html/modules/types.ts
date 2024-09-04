import { EditorNodeProperties } from "node-red";
import { OpenwareDataLiveOptions } from "../../shared/types";

export interface OpenwareDataLiveEditorNodeProperties
  extends EditorNodeProperties,
    OpenwareDataLiveOptions {}
