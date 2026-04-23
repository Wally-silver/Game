export type BuildingState = 'normal' | 'paused' | 'overtime';

export interface BuildingModel {
  id: string;
  name: string;
  type: string;
  base_output: number;
  worker_need: number;
  joy_effect: number;
  order_effect: number;
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
}
