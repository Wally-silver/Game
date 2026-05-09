import { CONFIG_KEY } from '../core/Constants';
import { ConfigManager } from '../managers/ConfigManager';
import { BuildingModel, BuildingRuntime } from '../models/BuildingModel';
import { RuleSystem } from './RuleSystem';

export interface BuildingTickResult { gold: number; joy: number; order: number; goalProgress: number; }

export class BuildingSystem {
  private buildings: BuildingModel[] = [];
  private runtime = new Map<string, BuildingRuntime>();

  constructor(private readonly configManager: ConfigManager) {}

  public initialize(): BuildingRuntime[] {
    this.buildings = this.configManager.getAll<BuildingModel>(CONFIG_KEY.BUILDINGS).slice(0, 3).sort((a,b)=>(a.display_order??999)-(b.display_order??999));
    this.runtime.clear();
    this.buildings.forEach((item) => {
      this.runtime.set(item.id, { id:item.id,name:item.name,state:'normal',paused:false,overtime:false,current_output:0,current_workers:0,worker_need:item.worker_need,pressure:0,risk:0 });
    });
    return this.getRuntimeBuildings();
  }

  public setWorkers(buildingId: string, workers: number): void { const d=this.runtime.get(buildingId); if(d) d.current_workers=workers; }
  public toggleOvertime(buildingId: string): void { const d=this.runtime.get(buildingId); if(!d||d.paused) return; d.overtime=!d.overtime; this.updateState(buildingId); }
  public togglePause(buildingId: string): void { const d=this.runtime.get(buildingId); if(!d) return; d.paused=!d.paused; if(d.paused) d.overtime=false; this.updateState(buildingId); }
  public setAbnormal(buildingId: string, abnormal: boolean): void { const d=this.runtime.get(buildingId); if(!d) return; d.risk = abnormal ? Math.max(d.risk, 100) : Math.min(d.risk, 40); this.updateState(buildingId); }

  public getRuntimeBuildings(): BuildingRuntime[] { return [...this.runtime.values()].map((i)=>({ ...i })); }

  public tick(ruleSystem: RuleSystem): BuildingTickResult {
    let gold=0, joy=0, order=0, goalProgress=0;
    this.buildings.forEach((config)=>{
      const run=this.runtime.get(config.id); if(!run) return;
      this.updateState(config.id);
      if(run.state==='paused'||run.state==='abnormal'){ if(run.state==='paused') order+=1; if(run.state==='abnormal') order-=3; return; }
      const workerRatio = Math.min(1.4, run.current_workers / Math.max(1, config.worker_need));
      const overtimeMul = run.overtime ? 1.4 : 1;
      const stateMul = run.state==='understaffed'?0.7:run.state==='overloaded'?0.85:1;
      const ruleMul = ruleSystem.getMultiplier('building_output') * ruleSystem.getMultiplier('gold_gain');
      run.current_output = Math.max(0, Math.round(config.base_output * workerRatio * overtimeMul * stateMul * ruleMul));
      gold += run.current_output;
      joy += config.joy_effect + ruleSystem.getAdditive('joy_change');
      order += config.order_effect + ruleSystem.getAdditive('order_change');
      goalProgress += Math.max(1, Math.round(run.current_output / 4));
      if (run.overtime) { joy -= 3; order -= 1; run.pressure += 10; run.risk += (config.risk_factor ?? 1.2) * 3; } else { run.pressure = Math.max(0, run.pressure - 4); run.risk = Math.max(0, run.risk - 2); }
      this.updateState(config.id);
    });
    return { gold, joy, order, goalProgress };
  }

  private updateState(buildingId: string): void {
    const run=this.runtime.get(buildingId); const config=this.buildings.find((b)=>b.id===buildingId); if(!run||!config) return;
    const pressureLimit = config.pressure_limit ?? 70;
    if (run.paused) { run.state='paused'; return; }
    if (run.risk >= 95) { run.state='abnormal'; return; }
    if (run.pressure >= pressureLimit || run.risk >= 70) { run.state='overloaded'; return; }
    if (run.current_workers < config.worker_need * 0.8) { run.state='understaffed'; return; }
    if (run.overtime) { run.state='overtime'; return; }
    run.state='normal';
  }
}
