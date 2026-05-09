# 《怪话小镇》- 产品化基础版（Phase B+）

当前状态：
- 可玩单局闭环：Home -> Battle -> Result
- Battle 场景已拆分为 Controller + HUD + Item 组件
- 规则弹窗与建筑列表均为动态项生成
- 运行态与结算态模型标准化（BattleRuntimeState / BattleSettlementData）

## 核心模块

- `BattleSceneController`：Battle 场景生命周期协调（初始化、规则选择、更新驱动、结算跳转）
- `BattleHUD`：纯 HUD 视图层（显示/输入回调）
- `BuildingActionItem`：建筑列表项组件
- `RuleSelectPopup` + `RuleOptionItem`：动态规则项选择弹窗
- `ResultSceneController` + `ResultReportView`：结算页数据绑定与交互

## Cocos Editor 挂载说明

### Launch.scene
- 挂 `LaunchView`

### Home.scene
- 挂 `HomeView`
- 按钮绑定：
  - 开始原型战局 -> `onTapStartGame`
  - 查看结果页（调试） -> `onTapViewResult`

### Battle.scene
- 挂 `BattleSceneController`
- 挂 `BattleHUD`
- 挂 `RuleSelectPopup`
- 在 `BattleSceneController` 上绑定：
  - `hud` -> BattleHUD
  - `rulePopup` -> RuleSelectPopup
- BattleHUD 中：
  - `buildingListRoot`：建筑项容器
  - `buildingItemTemplate`：单个建筑项模板节点（挂 `BuildingActionItem`）
- RuleSelectPopup 中：
  - `optionListRoot`：规则项容器
  - `optionTemplate`：规则项模板节点（挂 `RuleOptionItem`）

### Result.scene
- 挂 `ResultSceneController`
- 挂 `ResultReportView`
- 在 `ResultSceneController.reportView` 绑定 `ResultReportView`
- 按钮绑定到 `ResultSceneController`：
  - `onTapBackHome`
  - `onTapReplay`

## 运行流程

1. 打开项目并以 `Launch.scene` 启动
2. Home 点击“开始原型战局”进入 Battle
3. BattleSceneController 初始化战局并弹出规则选择
4. 选择规则后，Controller 在 `update(dt)` 驱动 BattleManager
5. HUD 响应局部事件刷新资源/建筑/规则/事件
6. 结算后跳转 Result，由 ResultSceneController 绑定报告数据

## 已实现与未实现边界

已实现：
- 原型战局循环、规则影响、建筑状态、事件触发、基础日报

未实现（仅预留接口或待后续）：
- 图鉴正式功能
- 精灵正式功能
- 商城正式功能
- 每日挑战正式功能
- 微信小游戏平台能力（分享/广告/排行榜/支付）
