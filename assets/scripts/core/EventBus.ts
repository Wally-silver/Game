/**
 * Simple typed event bus used by managers/systems.
 */
export type EventHandler<T = unknown> = (payload: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  public on<T = unknown>(eventName: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set<EventHandler>());
    }
    this.listeners.get(eventName)!.add(handler as EventHandler);
    return () => this.off(eventName, handler);
  }

  public off<T = unknown>(eventName: string, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(eventName);
    if (!handlers) {
      return;
    }
    handlers.delete(handler as EventHandler);
    if (handlers.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  public emit<T = unknown>(eventName: string, payload: T): void {
    const handlers = this.listeners.get(eventName);
    if (!handlers) {
      return;
    }
    handlers.forEach((handler) => handler(payload));
  }

  public clear(): void {
    this.listeners.clear();
  }
}
