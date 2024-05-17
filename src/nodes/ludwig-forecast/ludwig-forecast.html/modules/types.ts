import { EditorNodeProperties } from "node-red";
import { LudwigForecastOptions } from "../../shared/types";

export interface LudwigForecastEditorNodeProperties
  extends EditorNodeProperties,
    LudwigForecastOptions {}
