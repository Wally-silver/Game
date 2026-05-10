import { _decorator, Button, Component, Label } from 'cc';
import { App, AppServices } from '../../core/App';
import { SceneUIFactory } from '../../utils/SceneUIFactory';

const { ccclass } = _decorator;

@ccclass('HomeSceneController')
export class HomeSceneController extends Component {
  private goldLabel: Label | null = null;
  private inspirationLabel: Label | null = null;
  private services: AppServices | null = null;

  protected start(): void {
    this.services = App.getServices();
    this.buildUI();
    this.refresh();
  }

  private buildUI(): void {
    const sceneRouter = this.services!.sceneRouter;
    const root = SceneUIFactory.ensurePanel(this.node, 'HomeUIRoot');
    const col = SceneUIFactory.ensureVerticalGroup(root, 'HomeColumn', 16);

    SceneUIFactory.ensureLabel(col, 'Title', '《怪话小镇》', 32);
    this.goldLabel = SceneUIFactory.ensureLabel(col, 'Gold', '金币: 0');
    this.inspirationLabel = SceneUIFactory.ensureLabel(col, 'Inspiration', '灵感: 0');

    const start = SceneUIFactory.ensureButton(col, 'StartBattleBtn', '开始战局');
    SceneUIFactory.bindSingleClick(start.node, () => void sceneRouter.goBattle());

    const result = SceneUIFactory.ensureButton(col, 'DebugResultBtn', '查看结果页(调试)');
    SceneUIFactory.bindSingleClick(result.node, () => void sceneRouter.goResult());
  }

  private refresh(): void {
    const snapshot = this.services!.gameState.getSnapshot();
    if (this.goldLabel) this.goldLabel.string = `金币: ${snapshot.gold}`;
    if (this.inspirationLabel) this.inspirationLabel.string = `灵感: ${snapshot.inspiration}`;
  }
}
