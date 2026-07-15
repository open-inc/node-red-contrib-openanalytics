import { EditorNodeProperties } from "node-red";
import { OpenwareVirtualSensorOptions } from "../../shared/types";

export interface OpenwareVirtualSensorEditorNodeProperties
  extends EditorNodeProperties, OpenwareVirtualSensorOptions {}
