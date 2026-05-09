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
    const root = SceneUIFactory.createPanel(this.node, 'HomeUIRoot');
    const col = SceneUIFactory.createVerticalLayout(root, 'HomeColumn', 16);

    SceneUIFactory.createLabel(col, 'Title', '《怪话小镇》', 32);
    this.goldLabel = SceneUIFactory.createLabel(col, 'Gold', '金币: 0');
    this.inspirationLabel = SceneUIFactory.createLabel(col, 'Inspiration', '灵感: 0');

    const start = SceneUIFactory.createButton(col, 'StartBattleBtn', '开始战局');
    start.node.on(Button.EventType.CLICK, () => void App.instance?.sceneRouter.goBattle());

    const result = SceneUIFactory.createButton(col, 'DebugResultBtn', '查看结果页(调试)');
    result.node.on(Button.EventType.CLICK, () => void App.instance?.sceneRouter.goResult());
  }

  private refresh(): void {
    const snapshot = App.instance?.gameState.getSnapshot();
    if (!snapshot) return;
    if (this.goldLabel) this.goldLabel.string = `金币: ${snapshot.gold}`;
    if (this.inspirationLabel) this.inspirationLabel.string = `灵感: ${snapshot.inspiration}`;
  }
}
