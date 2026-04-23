import { _decorator, Component, Label } from 'cc';
import { App } from '../../core/App';

const { ccclass, property } = _decorator;

/**
 * Battle.scene 占位控制器。
 */
@ccclass('BattleHUD')
export class BattleHUD extends Component {
  @property(Label)
  public placeholderLabel: Label | null = null;

  protected start(): void {
    this.placeholderLabel && (this.placeholderLabel.string = 'Battle Placeholder');
    App.instance?.battleManager.prepareBattle();
  }

  public onTapBackHome(): void {
    App.instance?.battleManager.finishBattle();
    void App.instance?.sceneRouter.goHome();
  }
}
