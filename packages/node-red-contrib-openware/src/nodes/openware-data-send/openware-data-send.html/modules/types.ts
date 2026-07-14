import { EditorNodeProperties } from "node-red";
import { OpenwareDataSendOptions } from "../../shared/types";

export interface OpenwareDataSendEditorNodeProperties
  extends EditorNodeProperties,
    OpenwareDataSendOptions {}
