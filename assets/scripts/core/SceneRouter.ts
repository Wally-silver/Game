import { director } from 'cc';
import { EVENT_NAME, SCENE_NAME } from './Constants';
import { EventBus } from './EventBus';

export interface SceneLoadingHooks {
  beforeLoad?: (sceneName: string) => void;
  afterLoad?: (sceneName: string) => void;
}

/**
 * 场景跳转封装层。页面只依赖这个类，不直接碰 director。
 */
export class SceneRouter {
  constructor(
    private readonly eventBus: EventBus,
    private readonly hooks?: SceneLoadingHooks,
  ) {}

  public async goHome(): Promise<void> {
    await this.load(SCENE_NAME.HOME);
  }

  public async goBattle(): Promise<void> {
    await this.load(SCENE_NAME.BATTLE);
  }

  public async goResult(): Promise<void> {
    await this.load(SCENE_NAME.RESULT);
  }

  public async load(sceneName: string): Promise<void> {
    console.log(`[SceneRouter] loading scene: ${sceneName}`);
    this.hooks?.beforeLoad?.(sceneName);
    this.eventBus.emit(EVENT_NAME.SCENE_LOADING, { sceneName, loading: true });

    await new Promise<void>((resolve, reject) => {
      director.loadScene(sceneName, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

    this.eventBus.emit(EVENT_NAME.SCENE_LOADING, { sceneName, loading: false });
    this.hooks?.afterLoad?.(sceneName);
  }
}
