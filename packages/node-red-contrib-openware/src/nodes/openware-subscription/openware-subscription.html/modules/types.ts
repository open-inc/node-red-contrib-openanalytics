import { EditorNodeProperties } from "node-red";
import { OpenwareSubscriptionOptions } from "../../shared/types";

export interface OpenwareSubscriptionEditorNodeProperties
  extends EditorNodeProperties,
    OpenwareSubscriptionOptions {}
