import { _decorator, Component, Label } from 'cc';
import { BuildingRuntime } from '../../models/BuildingModel';

const { ccclass, property } = _decorator;

export interface BuildingActionHandlers {
  onOvertime: (buildingId: string) => void;
  onPause: (buildingId: string) => void;
}

@ccclass('BuildingActionItem')
export class BuildingActionItem extends Component {
  @property(Label) public titleLabel: Label | null = null;
  @property(Label) public detailLabel: Label | null = null;

  private buildingId = '';
  private handlers: BuildingActionHandlers | null = null;

  public bind(data: BuildingRuntime, handlers: BuildingActionHandlers): void {
    this.buildingId = data.id;
    this.handlers = handlers;
    this.refresh(data);
  }

  public refresh(data: BuildingRuntime): void {
    this.buildingId = data.id;
    if (this.titleLabel) {
      this.titleLabel.string = `${data.name} (${data.id})`;
    }
    if (this.detailLabel) {
      this.detailLabel.string = `状态:${data.state} 产出:${data.current_output} 人力:${data.current_workers}/${data.worker_need}`;
    }
  }

  public onTapOvertime(): void {
    if (!this.handlers) return;
    this.handlers.onOvertime(this.buildingId);
  }

  public onTapPause(): void {
    if (!this.handlers) return;
    this.handlers.onPause(this.buildingId);
  }
}
