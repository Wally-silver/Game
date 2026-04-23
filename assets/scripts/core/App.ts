import { _decorator, Component, director } from 'cc';
import { EVENT_NAME, SCENE_NAME } from './Constants';
import { EventBus } from './EventBus';
import { GameState } from './GameState';
import { SceneRouter } from './SceneRouter';
import { AudioManager } from '../managers/AudioManager';
import { BattleManager } from '../managers/BattleManager';
import { ConfigManager } from '../managers/ConfigManager';
import { SaveManager } from '../managers/SaveManager';
import { UIManager } from '../managers/UIManager';
import { Logger } from '../utils/Logger';

const { ccclass } = _decorator;

/**
 * 全局入口组件：建议挂在 Launch.scene 的常驻节点。
 */
@ccclass('App')
export class App extends Component {
  public static instance: App | null = null;

  public readonly eventBus = new EventBus();
  public readonly gameState = new GameState(this.eventBus);
  public readonly configManager = new ConfigManager(this.eventBus);
  public readonly saveManager = new SaveManager();
  public readonly uiManager = new UIManager();
  public readonly audioManager = new AudioManager();
  public readonly battleManager = new BattleManager(this.gameState, this.configManager, this.eventBus);
  public readonly sceneRouter = new SceneRouter(this.eventBus, {
    beforeLoad: (scene) => Logger.info(`Loading scene: ${scene}`),
    afterLoad: (scene) => Logger.info(`Loaded scene: ${scene}`),
  });

  protected onLoad(): void {
    if (App.instance) {
      this.node.destroy();
      return;
    }
    App.instance = this;
    director.addPersistRootNode(this.node);
  }

  protected start(): void {
    // LaunchView 会在 Launch.scene 中显式调用 bootstrap。
  }

  public async bootstrap(): Promise<void> {
    await this.configManager.loadAllConfigs();
    this.eventBus.emit(EVENT_NAME.CONFIG_LOADED, { allLoaded: true });

    if (director.getScene()?.name === SCENE_NAME.LAUNCH) {
      await this.sceneRouter.goHome();
    }
  }

  protected onDestroy(): void {
    if (App.instance === this) {
      App.instance = null;
    }
  }
}
