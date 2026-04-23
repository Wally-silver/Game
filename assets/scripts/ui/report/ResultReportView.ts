import { _decorator, Component, Label } from 'cc';
import { App } from '../../core/App';

const { ccclass, property } = _decorator;

/**
 * Result.scene 占位控制器，预留日报展示区域。
 */
@ccclass('ResultReportView')
export class ResultReportView extends Component {
  @property(Label)
  public placeholderLabel: Label | null = null;

  protected start(): void {
    this.placeholderLabel && (this.placeholderLabel.string = 'Result Placeholder（日报区域预留）');
  }

  public onTapBackHome(): void {
    void App.instance?.sceneRouter.goHome();
  }
}
