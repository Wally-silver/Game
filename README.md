# 《怪话小镇》- 阶段 B（最小可玩原型）

当前仓库已实现：
- Home -> Battle -> Result 的可跑通单局闭环
- 进入 Battle 后弹出 3 选 1 规则
- 规则生效后，建筑/居民/事件驱动资源变化
- 支持对建筑执行「加班」「暂停」两种干预
- 回合结束自动进入 Result，生成最简镇规日报

## 目录

```text
assets/scripts/
  core/
  managers/
  systems/
  models/
  ui/
    home/
    battle/
    popup/
    report/
  config/
```

## Cocos Editor 接线说明（关键）

1. `Launch.scene`
   - 挂 `LaunchView`（会触发 `App.bootstrap()`）

2. `Home.scene`
   - 挂 `HomeView`
   - 绑定按钮：
     - 开始原型战局 -> `onTapStartGame`
     - 查看结果页 -> `onTapViewResult`（调试）

3. `Battle.scene`
   - 挂 `BattleHUD`
   - 同场景挂 `RuleSelectPopup`
   - 在 `BattleHUD.rulePopup` 绑定该 `RuleSelectPopup` 组件
   - 绑定按钮：
     - `onTapBakeryOvertime` / `onTapOfficeOvertime` / `onTapParkOvertime`
     - `onTapBakeryPause` / `onTapOfficePause` / `onTapParkPause`
     - `onTapBackHome`

4. `Result.scene`
   - 挂 `ResultReportView`
   - 绑定按钮：
     - `onTapBackHome`
     - `onTapReplay`

## 运行

1. 用 Cocos Creator 打开 `/workspace/Game`
2. 设置 `Launch.scene` 为启动场景
3. 运行后：
   - Home 点击“开始原型战局”进入 Battle
   - 先选 1 条规则，再观察资源变化与事件播报
   - 使用建筑加班/暂停按钮干预
   - 倒计时结束或失败条件触发后自动进入 Result

## 判定逻辑（当前原型）

- 初始：order=70, joy=60, gold=100, timer=120
- 失败：order<=0 或 joy<=0
- 结束成功：倒计时归零后，order>0 且（goalProgress>=100 或 gold>=180）
