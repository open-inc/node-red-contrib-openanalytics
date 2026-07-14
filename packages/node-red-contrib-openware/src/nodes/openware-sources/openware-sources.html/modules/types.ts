import { EditorNodeProperties } from "node-red";
import { OpenwareSourcesOptions } from "../../shared/types";

export interface OpenwareSourcesEditorNodeProperties
  extends EditorNodeProperties,
    OpenwareSourcesOptions {
  server: string;
}
