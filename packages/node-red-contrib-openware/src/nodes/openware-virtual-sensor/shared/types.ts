export interface VirtualSensorDimension {
  name: string;
  unit: string;
  type: string;
}

export interface OpenwareVirtualSensorOptions {
  sensorId: string;
  sensorName: string;
  source: string;
  valueTypes: VirtualSensorDimension[];
  meta: string;
  timeout: string | number;
}
