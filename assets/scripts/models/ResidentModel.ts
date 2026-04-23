export type ResidentState = 'normal' | 'tired' | 'happy' | 'complaining';

export interface ResidentModel {
  id: string;
  name: string;
  profession: string;
  mood: number;
  energy: number;
  currentBuilding: string;
  currentState: ResidentState;
}
