/**
 * UI 状态管理器：统一记录弹窗/面板开关状态。
 */
export class UIManager {
  private openedPanels = new Set<string>();

  public open(panelId: string): void {
    this.openedPanels.add(panelId);
  }

  public close(panelId: string): void {
    this.openedPanels.delete(panelId);
  }

  public isOpen(panelId: string): boolean {
    return this.openedPanels.has(panelId);
  }

  public closeAll(): void {
    this.openedPanels.clear();
  }
}
