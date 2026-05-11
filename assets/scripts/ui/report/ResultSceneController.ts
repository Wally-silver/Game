import { _decorator, Button, Component, Node } from 'cc';
import { App, AppServices } from '../../core/App';
import { ResultReportView } from './ResultReportView';
import { SceneUIFactory } from '../../utils/SceneUIFactory';

const { ccclass, property } = _decorator;

@ccclass('ResultSceneController')
export class ResultSceneController extends Component {
  @property(ResultReportView) public reportView: ResultReportView | null = null;
  private services: AppServices | null = null;

  protected start(): void {
    this.services = App.getServices();
    if (!this.reportView) {
      const node = new Node('ResultReportViewNode');
      node.parent = this.node;
      this.reportView = node.addComponent(ResultReportView);
    }

    const app = App.instance;
    const report = app?.getLatestBattleReport() ?? this.services?.battleManager.getLastReport() ?? null;
    if (report) { this.services?.gameState.updateHighestStars(report.stars); }
    this.reportView.bindReport(report);

    if (this.reportView.backButton) {
      SceneUIFactory.bindSingleClick(this.reportView.backButton.node, () => this.onTapBackHome());
    }
    if (this.reportView.retryButton) {
      SceneUIFactory.bindSingleClick(this.reportView.retryButton.node, () => this.onTapReplay());
    }
  }

  public onTapBackHome(): void { if (this.services) void this.services.sceneRouter.goHome(); }
  public onTapReplay(): void { if (this.services) void this.services.sceneRouter.goBattle(); }
}
