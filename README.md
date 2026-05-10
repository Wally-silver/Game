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
