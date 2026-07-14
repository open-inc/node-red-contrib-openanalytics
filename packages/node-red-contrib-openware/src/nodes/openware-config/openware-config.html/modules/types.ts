import { EditorNodeProperties } from "node-red";
import { OpenwareConfigOptions } from "../../shared/types";

export interface OpenwareConfigEditorNodeProperties
  extends EditorNodeProperties,
    OpenwareConfigOptions {
  host: string;
  port: number;
}
