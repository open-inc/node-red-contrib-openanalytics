import { EditorNodeProperties } from "node-red";
import { OpenwareStreamSendOptions } from "../../shared/types";

export interface OpenwareStreamSendEditorNodeProperties
  extends EditorNodeProperties,
    OpenwareStreamSendOptions {}
