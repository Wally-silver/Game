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
  gold: number;
  goalProgress: number;
  buildings: BuildingRuntime[];
  triggeredEventCount: number;
}

export class EventSystem {
  private events: EventModel[] = [];
  private lastTriggerTime = new Map<string, number>();

  constructor(private readonly configManager: ConfigManager, private readonly eventBus: EventBus) {}

  public initialize(): void {
    this.events = this.configManager.getAll<EventModel>(CONFIG_KEY.EVENTS);
    this.lastTriggerTime.clear();
  }

  public checkAndTrigger(elapsedSeconds: number, context: EventContext, ruleSystem: RuleSystem, residentSystem: ResidentSystem): TriggeredEvent | null {
    for (const item of this.events) {
      if (!this.matchTimeCooldown(item, elapsedSeconds)) continue;
      if (!this.matchRuleConditions(item, ruleSystem)) continue;
      if (!this.matchResourceConditions(item, context)) continue;
      if (!this.matchBuildingConditions(item, context.buildings)) continue;
      if (!this.matchResidentConditions(item, residentSystem)) continue;
      if (Math.random() > item.chance) continue;
      const triggered: TriggeredEvent = { id:item.id, name:item.name, desc:item.desc, effect_order:item.effect_order ?? 0, effect_joy:item.effect_joy ?? 0, effect_gold:item.effect_gold ?? 0, effect_goal:item.effect_goal ?? 0 };
      this.lastTriggerTime.set(item.id, elapsedSeconds);
      this.eventBus.emit(EVENT_NAME.BATTLE_EVENT_TRIGGERED, triggered);
      return triggered;
    }
    return null;
  }

  private matchTimeCooldown(event: EventModel, elapsedSeconds: number): boolean {
    const lastTime = this.lastTriggerTime.get(event.id) ?? -9999;
    return elapsedSeconds - lastTime >= event.cooldown;
  }

  private matchRuleConditions(event: EventModel, ruleSystem: RuleSystem): boolean {
    if (event.trigger_rule_tag && !ruleSystem.hasTag(event.trigger_rule_tag)) return false;
    if (event.rule_category && ruleSystem.getActiveRuleCategory() !== event.rule_category) return false;
    return true;
  }

  private matchResourceConditions(event: EventModel, ctx: EventContext): boolean {
    if (typeof event.min_order === 'number' && ctx.order < event.min_order) return false;
    if (typeof event.max_joy === 'number' && ctx.joy > event.max_joy) return false;
    if (typeof event.min_gold === 'number' && ctx.gold < event.min_gold) return false;
    if (typeof event.max_gold === 'number' && ctx.gold > event.max_gold) return false;
    if (typeof event.min_goal_progress === 'number' && ctx.goalProgress < event.min_goal_progress) return false;
    if (typeof event.min_event_count === 'number' && ctx.triggeredEventCount < event.min_event_count) return false;
    return true;
  }

  private matchBuildingConditions(event: EventModel, buildings: BuildingRuntime[]): boolean {
    if (event.building_id && !buildings.some((b) => b.id === event.building_id)) return false;
    if (event.trigger_building_state && !buildings.some((b) => b.state === event.trigger_building_state && (!event.building_id || b.id === event.building_id))) return false;
    return true;
  }

  private matchResidentConditions(event: EventModel, residentSystem: ResidentSystem): boolean {
    if (event.trigger_resident_state && !residentSystem.hasState(event.trigger_resident_state)) return false;
    return true;
  }
}
