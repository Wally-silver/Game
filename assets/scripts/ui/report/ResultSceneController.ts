import { _decorator, Button, Component, Node } from 'cc';
import { App } from '../../core/App';
import { ResultReportView } from './ResultReportView';

const { ccclass, property } = _decorator;

@ccclass('ResultSceneController')
export class ResultSceneController extends Component {
  @property(ResultReportView) public reportView: ResultReportView | null = null;

  protected start(): void {
    if (!this.reportView) {
      const node = new Node('ResultReportViewNode');
      node.parent = this.node;
      this.reportView = node.addComponent(ResultReportView);
    }

    const app = App.instance;
    const report = app?.getLatestBattleReport() ?? app?.battleManager.getLastReport() ?? null;
    this.reportView.bindReport(report);

    if (this.reportView.backButton) {
      this.reportView.backButton.node.off(Button.EventType.CLICK);
      this.reportView.backButton.node.on(Button.EventType.CLICK, () => this.onTapBackHome());
    }
    if (this.reportView.retryButton) {
      this.reportView.retryButton.node.off(Button.EventType.CLICK);
      this.reportView.retryButton.node.on(Button.EventType.CLICK, () => this.onTapReplay());
    }
  }

  public onTapBackHome(): void { void App.instance?.sceneRouter.goHome(); }
  public onTapReplay(): void { void App.instance?.sceneRouter.goBattle(); }
}
