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
import { ReportModel } from '../models/ReportModel';

const { ccclass } = _decorator;

export interface AppServices {
  eventBus: EventBus;
  gameState: GameState;
  configManager: ConfigManager;
  saveManager: SaveManager;
  uiManager: UIManager;
  audioManager: AudioManager;
  battleManager: BattleManager;
  sceneRouter: SceneRouter;
}

@ccclass('App')
export class App extends Component {
  public latestBattleReport: ReportModel | null = null;
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

  public getLatestBattleReport(): ReportModel | null {
    return this.latestBattleReport ? JSON.parse(JSON.stringify(this.latestBattleReport)) : null;
  }

  public static getServices(): AppServices {
    if (!App.instance) {
      throw new Error('App is not initialized.');
    }
    return {
      eventBus: App.instance.eventBus,
      gameState: App.instance.gameState,
      configManager: App.instance.configManager,
      saveManager: App.instance.saveManager,
      uiManager: App.instance.uiManager,
      audioManager: App.instance.audioManager,
      battleManager: App.instance.battleManager,
      sceneRouter: App.instance.sceneRouter,
    };
  }

  protected onLoad(): void {
    if (App.instance) {
      this.node.destroy();
      return;
    }
    App.instance = this;
    director.addPersistRootNode(this.node);
  }

  public async bootstrap(): Promise<void> {
    const defaultSave = {
      version: SaveManager.CURRENT_VERSION,
      playerGold: this.gameState.getSnapshot().gold,
      inspiration: this.gameState.getSnapshot().inspiration,
      highestStars: 0,
      unlockedRules: [],
      seenEvents: [],
      totalRuns: 0,
      totalWins: 0,
      settings: { musicOn: true, sfxOn: true },
    };
    const save = this.saveManager.loadProgression(defaultSave);
    this.gameState.importProgression(save);

    await this.configManager.loadAllConfigs();
    this.eventBus.emit(EVENT_NAME.CONFIG_LOADED, { allLoaded: true });

    this.eventBus.on(EVENT_NAME.GAME_STATE_CHANGED, () => {
      const data = this.gameState.exportProgression();
      this.saveManager.saveProgression({ version: SaveManager.CURRENT_VERSION, ...data });
    });

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
