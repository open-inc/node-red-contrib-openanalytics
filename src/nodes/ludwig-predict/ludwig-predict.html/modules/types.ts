import { EditorNodeProperties } from "node-red";
import { LudwigPredictOptions } from "../../shared/types";

export interface LudwigPredictEditorNodeProperties
  extends EditorNodeProperties,
    LudwigPredictOptions {}
