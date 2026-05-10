# 《怪话小镇》- Cocos 可运行落地版（Phase B+ Runtime Ready）

## 1) 当前阶段
当前仓库已经从“结构化原型”推进到“可运行场景落地版”：
- Home -> Battle -> Result 主流程可跑
- Battle 由 SceneController 协调
- HUD/Popup/Item/View 支持运行时自动构建节点
- 减少了大量手工拖拽依赖

## 2) 已实现功能
- Home 场景：标题、资源、开始战局、调试结果页入口
- Battle 场景：规则弹窗、战局驱动、资源显示、建筑操作、事件播报、结算跳转
- Result 场景：规则/标题/胜负/资源/事件数展示，返回主页、再来一局

## 3) 未实现功能（仍为占位）
- 图鉴正式功能
- 精灵正式功能
- 商城正式功能
- 每日挑战正式功能
- 微信小游戏平台能力（分享/广告/支付/排行榜）

## 4) 三个场景运行关系
Launch -> Home -> Battle -> Result

## 5) 运行时构建 UI 方案
项目采用“最小 scene + 运行时构建 UI”策略：
- Scene 中只需挂载控制器脚本
- 控制器和 UI 组件会在节点缺失时自动创建 Label/Button/容器（统一使用 SceneUIFactory.ensure*）
- 大幅降低“必须手工补齐几十个节点”风险
- 同名节点优先复用，避免 onLoad/start 重复进入时 UI 堆叠

## 6) Cocos Creator 打开与运行
1. 打开 `/workspace/Game`
2. 启动场景设置为 `Launch.scene`
3. 运行后自动进入 Home

## 7) 最少手工挂载步骤（建议）
### Home.scene
- 挂 `HomeSceneController`

### Battle.scene
- 挂 `BattleSceneController`
- （可选）预挂 `BattleHUD`、`RuleSelectPopup`；若不挂会运行时自动创建

### Result.scene
- 挂 `ResultSceneController`
- （可选）预挂 `ResultReportView`；若不挂会运行时自动创建

## 8) 主流程验证
1. Home 点击“开始战局”
2. Battle 弹规则选择
3. 选择规则后战局推进
4. 操作建筑按钮（加班/暂停）
5. 战局结束跳 Result
6. Result 点击返回主页或再来一局

## 9) 脚本职责（核心）
- `HomeSceneController`：主页唯一入口与 UI 初始化
- `HomeView`：兼容占位，不承载业务初始化
- `BattleSceneController`：战局生命周期协调
- `BattleHUD`：展示与输入回调
- `RuleSelectPopup`：规则选择弹窗
- `ResultSceneController`：结算页数据绑定与交互
- `ResultReportView`：结算展示视图
- `App.latestBattleReport` / `App.getLatestBattleReport()`：Battle -> Result 标准化结果入口（BattleManager 在新战局开始时清空）

## 10) Mock/占位说明
- 数值、规则、事件、日报标题均为本地 mock 配置
- UI 为功能验证优先的轻量实现


## 11) 本轮可玩性升级（V1）
- 规则扩充至 20 条，保持 3选1 并支持逐步解锁。
- 事件扩充至 15 条，加入怪谈播报风格与里程碑播报。
- 建筑扩充至 6 个（新增修理铺/便利店/邮局）。
- 居民模板扩充至 8 个。
- 新增局内干预：调岗支援、全镇安抚（消耗金币+冷却+次数限制）。
- Result 新增 5 星评级、关键事件、镇长点评、解锁反馈。


## 12) 第二阶段平衡打磨（Phase C-lite）
- 通过配置微调完成规则/建筑/事件第一轮平衡，减少无脑最优策略。
- 战局节奏调整：更快进入压力期，中后段增加里程碑与冲线张力。
- Battle 播报分级为【快讯/重要/警报级】，并补充危险与决策提示。
- Result 增加拆项评分、关键决策复盘、新增见闻事件提示。
- 复玩钩子增强：规则解锁节奏更清晰、首次见闻事件前台化。


## 13) 稳定性与持久化升级
- SaveManager 已接入 progression 持久化（version、金币、灵感、最高星级、解锁规则、见闻事件、总局数、总胜局、基础设置）。
- GameState 支持 progression 的导入/导出，Battle 临时态与永久态分离。
- SceneUIFactory 增加安全点击绑定与模板保留清理能力，降低重复绑定与重复创建风险。
- Battle 生命周期补充 pause/resume/stop，场景反复进入更稳。


## 14) Progression 闭环（本轮修复）
- progression 持久化字段：version、playerGold、inspiration、highestStars、unlockedRules、seenEvents、totalRuns、totalWins、settings。
- 保存时机：当前通过 `GAME_STATE_CHANGED` 统一触发保存；核心进度写入仍只在结算、解锁、首见事件、设置变更节点发生。
- 胜局统计：仅在 `BattleManager.endBattle(success)` 内记录，Result 展示层不再累计胜局。
- 成功条件：`goalProgress >= 100` 或 `gold >= targetGold`，并且 order > 0。
- 本局金币转永久金币：结算奖励公式（保守版）
  - `rewardGold = max(6, floor(finalGold * 0.12) + successBonus + starsEstimateBonus)`
  - 其中 successBonus 成功时 +12，starsEstimateBonus 按结算阶段给 3~12。
  - rewardGold 在结算时写入 `GameState.addGold()` 并持久化。
