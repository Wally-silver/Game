export type EventPayload = Record<string, unknown> | string | number | boolean | null | undefined;
export type EventHandler<T = EventPayload> = (payload?: T) => void;

/**
 * 轻量事件总线：模块间通信统一从这里走。
 */
export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  public on<T = EventPayload>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set<EventHandler>());
    }
    this.handlers.get(event)!.add(handler as EventHandler);
    return () => this.off(event, handler);
  }

  public once<T = EventPayload>(event: string, handler: EventHandler<T>): () => void {
    const unsubscribe = this.on<T>(event, (payload) => {
      unsubscribe();
      handler(payload);
    });
    return unsubscribe;
  }

  public off<T = EventPayload>(event: string, handler: EventHandler<T>): void {
    const set = this.handlers.get(event);
    if (!set) {
      return;
    }
    set.delete(handler as EventHandler);
    if (set.size === 0) {
      this.handlers.delete(event);
    }
  }

  public emit<T = EventPayload>(event: string, payload?: T): void {
    const set = this.handlers.get(event);
    if (!set) {
      return;
    }
    [...set].forEach((handler) => handler(payload));
  }

  public clear(event?: string): void {
    if (event) {
      this.handlers.delete(event);
      return;
    }
    this.handlers.clear();
  }
}
