import { EVENT_KEYS } from './Constants';
import { EventBus } from './EventBus';

export interface SceneAdapter {
  loadScene(sceneName: string): Promise<void>;
}

/**
 * Scene transition gateway to keep scene API out of gameplay logic.
 */
export class SceneRouter {
  private currentScene = '';

  constructor(
    private readonly adapter: SceneAdapter,
    private readonly eventBus: EventBus,
  ) {}

  public async goTo(sceneName: string): Promise<void> {
    if (sceneName === this.currentScene) {
      return;
    }

    this.eventBus.emit(EVENT_KEYS.SCENE_WILL_CHANGE, {
      from: this.currentScene,
      to: sceneName,
    });

    await this.adapter.loadScene(sceneName);
    this.currentScene = sceneName;

    this.eventBus.emit(EVENT_KEYS.SCENE_DID_CHANGE, {
      current: this.currentScene,
    });
  }

  public getCurrentScene(): string {
    return this.currentScene;
  }
}
