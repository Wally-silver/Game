/**
 * Central UI registry for opening/closing windows in a consistent way.
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
}
