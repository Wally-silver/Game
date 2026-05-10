import { _decorator, Button, Component, Label } from 'cc';
import { App } from '../../core/App';
import { SceneUIFactory } from '../../utils/SceneUIFactory';

const { ccclass } = _decorator;

@ccclass('HomeSceneController')
export class HomeSceneController extends Component {
  private goldLabel: Label | null = null;
  private inspirationLabel: Label | null = null;

  protected start(): void {
    this.buildUI();
    this.refresh();
  }

  private buildUI(): void {
    const { sceneRouter } = App.getServices();
    const root = SceneUIFactory.ensurePanel(this.node, 'HomeUIRoot');
    const col = SceneUIFactory.ensureVerticalGroup(root, 'HomeColumn', 16);

    SceneUIFactory.ensureLabel(col, 'Title', '《怪话小镇》', 32);
    this.goldLabel = SceneUIFactory.ensureLabel(col, 'Gold', '金币: 0');
    this.inspirationLabel = SceneUIFactory.ensureLabel(col, 'Inspiration', '灵感: 0');

    const start = SceneUIFactory.ensureButton(col, 'StartBattleBtn', '开始战局');
    start.node.off(Button.EventType.CLICK);
    start.node.on(Button.EventType.CLICK, () => void sceneRouter.goBattle());

    const result = SceneUIFactory.ensureButton(col, 'DebugResultBtn', '查看结果页(调试)');
    result.node.off(Button.EventType.CLICK);
    result.node.on(Button.EventType.CLICK, () => void sceneRouter.goResult());
  }

  private refresh(): void {
    const { gameState } = App.getServices();
    const snapshot = gameState.getSnapshot();
    if (this.goldLabel) this.goldLabel.string = `金币: ${snapshot.gold}`;
    if (this.inspirationLabel) this.inspirationLabel.string = `灵感: ${snapshot.inspiration}`;
  }
}
