import { _decorator, Component, Label } from 'cc';
import { App } from './App';

const { ccclass, property } = _decorator;

/**
 * Launch.scene 控制器：负责触发 App 初始化。
 */
@ccclass('LaunchView')
export class LaunchView extends Component {
  @property(Label)
  public statusLabel: Label | null = null;

  protected async start(): Promise<void> {
    console.log('[LaunchView] start');
    if (this.statusLabel) {
      this.statusLabel.string = '初始化中...';
    }

    if (!App.instance) {
      this.node.addComponent(App);
      await Promise.resolve();
    }

    await App.instance?.bootstrap();
    console.log('[LaunchView] bootstrap completed');

    if (this.statusLabel) {
      this.statusLabel.string = '初始化完成';
    }
    console.log('[LaunchView] go home');
  }
}
