import { _decorator, Component, Label } from 'cc';
import { App } from '../../core/App';

const { ccclass, property } = _decorator;

/**
 * Home.scene 控制器：展示资源并提供场景跳转按钮回调。
 */
@ccclass('HomeView')
export class HomeView extends Component {
  @property(Label)
  public goldLabel: Label | null = null;

  @property(Label)
  public inspirationLabel: Label | null = null;

  protected start(): void {
    this.refreshPlayerInfo();
  }

  public onTapStartGame(): void {
    void App.instance?.sceneRouter.goBattle();
  }

  public onTapViewResult(): void {
    void App.instance?.sceneRouter.goResult();
  }

  private refreshPlayerInfo(): void {
    const snapshot = App.instance?.gameState.getSnapshot();
    if (!snapshot) {
      return;
    }

    if (this.goldLabel) {
      this.goldLabel.string = `金币: ${snapshot.gold}`;
    }
    if (this.inspirationLabel) {
      this.inspirationLabel.string = `灵感: ${snapshot.inspiration}`;
    }
  }
}
