import { SCENE_NAMES } from './Constants';
import { EventBus } from './EventBus';
import { GameState } from './GameState';
import { SceneAdapter, SceneRouter } from './SceneRouter';
import { ConfigManager } from '../managers/ConfigManager';
import { Logger } from '../utils/Logger';

/**
 * Composition root for global services.
 */
export class App {
  public readonly eventBus: EventBus;
  public readonly gameState: GameState;
  public readonly configManager: ConfigManager;
  public readonly sceneRouter: SceneRouter;

  constructor(sceneAdapter: SceneAdapter) {
    this.eventBus = new EventBus();
    this.gameState = new GameState(this.eventBus);
    this.configManager = new ConfigManager(this.eventBus);
    this.sceneRouter = new SceneRouter(sceneAdapter, this.eventBus);
  }

  public async start(): Promise<void> {
    await this.configManager.loadAll();
    Logger.info('App started, configs ready.');
    await this.sceneRouter.goTo(SCENE_NAMES.HOME);
  }
}
