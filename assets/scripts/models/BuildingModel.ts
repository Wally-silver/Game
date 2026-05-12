export type BuildingState = 'normal' | 'understaffed' | 'overloaded' | 'paused' | 'overtime' | 'abnormal';

export interface BuildingModel {
  id: string;
  name: string;
  type: string;
  base_output: number;
  worker_need: number;
  joy_effect: number;
  order_effect: number;
  pressure_limit?: number;
  risk_factor?: number;
  display_order?: number;
}

export interface BuildingRuntime {
  id: string;
  name: string;
  state: BuildingState;
  paused: boolean;
  overtime: boolean;
  current_output: number;
  current_workers: number;
  worker_need: number;
  pressure: number;
  risk: number;
}
