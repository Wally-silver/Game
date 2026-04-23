import { CONFIG_KEY, EVENT_NAME } from '../core/Constants';
import { EventBus } from '../core/EventBus';
import { ConfigManager } from '../managers/ConfigManager';
import { BuildingRuntime } from '../models/BuildingModel';
import { EventModel, TriggeredEvent } from '../models/EventModel';
import { ResidentSystem } from './ResidentSystem';
import { RuleSystem } from './RuleSystem';

export interface EventContext {
  order: number;
  joy: number;
  buildings: BuildingRuntime[];
}

/**
 * 事件系统：按间隔检测条件并触发事件。
 */
export class EventSystem {
  private events: EventModel[] = [];
  private lastTriggerTime = new Map<string, number>();

  constructor(
    private readonly configManager: ConfigManager,
    private readonly eventBus: EventBus,
  ) {}

  public initialize(): void {
    this.events = this.configManager.getAll<EventModel>(CONFIG_KEY.EVENTS);
    this.lastTriggerTime.clear();
  }

  public checkAndTrigger(
    elapsedSeconds: number,
    context: EventContext,
    ruleSystem: RuleSystem,
    residentSystem: ResidentSystem,
  ): TriggeredEvent | null {
    for (const item of this.events) {
      if (!this.matches(item, context, ruleSystem, residentSystem, elapsedSeconds)) {
        continue;
      }
      if (Math.random() > item.chance) {
        continue;
      }

      const triggered: TriggeredEvent = {
        id: item.id,
        name: item.name,
        desc: item.desc,
        effect_order: item.effect_order ?? 0,
        effect_joy: item.effect_joy ?? 0,
        effect_gold: item.effect_gold ?? 0,
        effect_goal: item.effect_goal ?? 0,
      };
      this.lastTriggerTime.set(item.id, elapsedSeconds);
      this.eventBus.emit(EVENT_NAME.BATTLE_EVENT_TRIGGERED, triggered);
      return triggered;
    }
    return null;
  }

  private matches(
    event: EventModel,
    context: EventContext,
    ruleSystem: RuleSystem,
    residentSystem: ResidentSystem,
    elapsedSeconds: number,
  ): boolean {
    const lastTime = this.lastTriggerTime.get(event.id) ?? -9999;
    if (elapsedSeconds - lastTime < event.cooldown) {
      return false;
    }

    if (event.trigger_rule_tag && !ruleSystem.hasTag(event.trigger_rule_tag)) {
      return false;
    }

    if (typeof event.min_order === 'number' && context.order < event.min_order) {
      return false;
    }

    if (typeof event.max_joy === 'number' && context.joy > event.max_joy) {
      return false;
    }

    if (event.trigger_building_state) {
      const ok = context.buildings.some((b) => b.state === event.trigger_building_state);
      if (!ok) {
        return false;
      }
    }

    if (event.trigger_resident_state && !residentSystem.hasState(event.trigger_resident_state)) {
      return false;
    }

    return true;
  }
}
