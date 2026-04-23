import { EventModel } from '../models/EventModel';

/**
 * 事件系统骨架：阶段 A 仅提供事件筛选入口。
 */
export class EventSystem {
  public getTriggeredEvents(events: EventModel[], trigger: string): EventModel[] {
    return events.filter((item) => item.trigger === trigger || item.trigger === 'random');
  }
}
