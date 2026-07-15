import { EditorNodeProperties } from "node-red";
import { OpenwareVirtualSensorResponseOptions } from "../../shared/types";

export interface OpenwareVirtualSensorResponseEditorNodeProperties
  extends EditorNodeProperties, OpenwareVirtualSensorResponseOptions {}
