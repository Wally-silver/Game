export type EventPayload = unknown;
export type EventHandler<T = unknown> = (payload?: T) => void;

/**
 * 轻量事件总线：模块间通信统一从这里走。
 */
export class EventBus {
  private handlers = new Map<string, Set<EventHandler<unknown>>>();

  public on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set<EventHandler<unknown>>());
    }
    this.handlers.get(event)!.add(handler as EventHandler<unknown>);
    return () => this.off(event, handler);
  }

  public once<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    const unsubscribe = this.on<T>(event, (payload) => {
      unsubscribe();
      handler(payload);
    });
    return unsubscribe;
  }

  public off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const set = this.handlers.get(event);
    if (!set) {
      return;
    }
    set.delete(handler as EventHandler<unknown>);
    if (set.size === 0) {
      this.handlers.delete(event);
    }
  }

  public emit<T = unknown>(event: string, payload?: T): void {
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
