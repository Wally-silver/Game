import { _decorator, Button, Component, Label, Node } from 'cc';
import { BuildingRuntime } from '../../models/BuildingModel';
import { SceneUIFactory } from '../../utils/SceneUIFactory';

const { ccclass, property } = _decorator;

export interface BuildingActionHandlers {
  onOvertime: (buildingId: string) => void;
  onPause: (buildingId: string) => void;
  onReassign: (buildingId: string) => void;
}

@ccclass('BuildingActionItem')
export class BuildingActionItem extends Component {
  @property(Label) public nameLabel: Label | null = null;
  @property(Label) public stateLabel: Label | null = null;
  @property(Label) public outputLabel: Label | null = null;
  @property(Label) public workforceLabel: Label | null = null;
  @property(Button) public overtimeButton: Button | null = null;
  @property(Button) public pauseButton: Button | null = null;
  @property(Button) public reassignButton: Button | null = null;
  @property(Node) public abnormalHighlight: Node | null = null;

  private buildingId = '';
  private handlers: BuildingActionHandlers | null = null;

  protected onLoad(): void {
    this.ensureUI();
  }

  public bind(data: BuildingRuntime, handlers: BuildingActionHandlers): void {
    this.ensureUI();
    this.handlers = handlers;
    this.refresh(data);
  }

  public refresh(data: BuildingRuntime): void {
    this.buildingId = data.id;
    this.nameLabel && (this.nameLabel.string = data.name);
    const stateHint = data.state === 'abnormal' ? '⚠严重异常' : data.state === 'overloaded' ? '⚠过载' : data.state === 'understaffed' ? '⚠缺员' : data.state;
    this.stateLabel && (this.stateLabel.string = `状态: ${stateHint}`);
    this.outputLabel && (this.outputLabel.string = `产出: ${data.current_output}`);
    this.workforceLabel && (this.workforceLabel.string = `人力: ${data.current_workers}/${data.worker_need}`);

    const abnormal = data.state === 'abnormal' || data.state === 'overloaded' || data.state === 'understaffed';
    if (this.abnormalHighlight) this.abnormalHighlight.active = abnormal;
  }

  public onTapOvertime(): void { if (this.handlers) this.handlers.onOvertime(this.buildingId); }
  public onTapPause(): void { if (this.handlers) this.handlers.onPause(this.buildingId); }
  public onTapReassign(): void { if (this.handlers) this.handlers.onReassign(this.buildingId); }

  private ensureUI(): void {
    this.nameLabel = this.nameLabel ?? SceneUIFactory.ensureLabel(this.node, 'BuildingName', '建筑');
    this.stateLabel = this.stateLabel ?? SceneUIFactory.ensureLabel(this.node, 'State', '状态: normal', 18);
    this.outputLabel = this.outputLabel ?? SceneUIFactory.ensureLabel(this.node, 'Output', '产出: 0', 18);
    this.workforceLabel = this.workforceLabel ?? SceneUIFactory.ensureLabel(this.node, 'Workforce', '人力: 0/0', 18);

    const overtime = SceneUIFactory.ensureButton(this.node, 'OvertimeBtn', '加班');
    this.overtimeButton = this.overtimeButton ?? overtime.button;
    SceneUIFactory.bindSingleClick(overtime.node, () => this.onTapOvertime());

    const pause = SceneUIFactory.ensureButton(this.node, 'PauseBtn', '暂停');
    const reassign = SceneUIFactory.ensureButton(this.node, 'ReassignBtn', '调岗支援');
    this.pauseButton = this.pauseButton ?? pause.button;
    SceneUIFactory.bindSingleClick(pause.node, () => this.onTapPause());

    this.reassignButton = this.reassignButton ?? reassign.button;
    SceneUIFactory.bindSingleClick(reassign.node, () => this.onTapReassign());

    if (!this.abnormalHighlight) {
      this.abnormalHighlight = this.node.getChildByName('AbnormalHighlight') ?? new Node('AbnormalHighlight');
      this.abnormalHighlight.parent = this.node;
      this.abnormalHighlight.active = false;
    }
  }
}
