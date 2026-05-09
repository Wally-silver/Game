import { _decorator, Button, Component, Label, Node } from 'cc';
import { BuildingRuntime } from '../../models/BuildingModel';

const { ccclass, property } = _decorator;

export interface BuildingActionHandlers {
  onOvertime: (buildingId: string) => void;
  onPause: (buildingId: string) => void;
}

@ccclass('BuildingActionItem')
export class BuildingActionItem extends Component {
  @property(Label) public nameLabel: Label | null = null;
  @property(Label) public stateLabel: Label | null = null;
  @property(Label) public outputLabel: Label | null = null;
  @property(Label) public workforceLabel: Label | null = null;
  @property(Button) public overtimeButton: Button | null = null;
  @property(Button) public pauseButton: Button | null = null;
  @property(Node) public abnormalHighlight: Node | null = null;

  private buildingId = '';
  private handlers: BuildingActionHandlers | null = null;

  public bind(data: BuildingRuntime, handlers: BuildingActionHandlers): void {
    this.handlers = handlers;
    this.refresh(data);
  }

  public refresh(data: BuildingRuntime): void {
    this.buildingId = data.id;
    this.nameLabel && (this.nameLabel.string = data.name);
    this.stateLabel && (this.stateLabel.string = `状态: ${data.state}`);
    this.outputLabel && (this.outputLabel.string = `产出: ${data.current_output}`);
    this.workforceLabel && (this.workforceLabel.string = `人力: ${data.current_workers}/${data.worker_need}`);

    const abnormal = data.state === 'abnormal' || data.state === 'overloaded' || data.state === 'understaffed';
    if (this.abnormalHighlight) this.abnormalHighlight.active = abnormal;
  }

  public onTapOvertime(): void { if (this.handlers) this.handlers.onOvertime(this.buildingId); }
  public onTapPause(): void { if (this.handlers) this.handlers.onPause(this.buildingId); }
}
