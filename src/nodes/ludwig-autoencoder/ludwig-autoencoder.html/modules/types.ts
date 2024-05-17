import { EditorNodeProperties } from "node-red";
import { LudwigAutoencoderOptions } from "../../shared/types";

export interface LudwigAutoencoderEditorNodeProperties
  extends EditorNodeProperties,
    LudwigAutoencoderOptions {}
