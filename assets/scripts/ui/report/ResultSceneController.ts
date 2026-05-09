import { _decorator, Component } from 'cc';
import { App } from '../../core/App';
import { ResultReportView } from './ResultReportView';

const { ccclass, property } = _decorator;

@ccclass('ResultSceneController')
export class ResultSceneController extends Component {
  @property(ResultReportView) public reportView: ResultReportView | null = null;

  protected start(): void {
    this.reportView?.bindReport(App.instance?.battleManager.getLastReport() ?? null);
  }

  public onTapBackHome(): void {
    void App.instance?.sceneRouter.goHome();
  }

  public onTapReplay(): void {
    void App.instance?.sceneRouter.goBattle();
  }
}
