export interface LudwigForecastOptions {
  modelname: string;
  window: number;
  dimension: number;
  mode: "train" | "predict";
  samples: number;
}
