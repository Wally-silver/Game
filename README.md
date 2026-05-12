# WeirdRuleTown - Cocos Creator 3.8.8

本仓库已整理为可直接被 Cocos Creator 打开的工程骨架（单场景优先）。

## 当前阶段
- 单场景主流程：`HOME -> BATTLE -> RESULT`
- 运行时 UI 自动创建（无需手动摆复杂节点）
- 最小可玩闭环可运行（规则选择、战局倒计时、建筑操作、事件、结算）

## 已实现
- `GameMainController` 作为单场景入口控制器
- `App` 幂等 bootstrap 与服务组装
- `SceneUIFactory` 布局兜底：Canvas/全屏 root/UI_2D/按钮单击绑定
- `BattleManager` 战局循环与结算
- `RuleSelectPopup` 3选1与 fallback
- `BattleHUD` 建筑列表、状态、操作按钮、事件播报
- `ResultReportView` 结果展示（胜负/星级/奖励/关键事件）
- `ConfigManager` 配置 + fallback
- `SaveManager` 旧建筑 ID 迁移（Bakery -> bakery 等）

## 未实现
- 微信平台适配、支付、广告、排行榜、商城、网络/云开发、多人

## 如何直接打开运行
1. 用 Cocos Creator 3.8.8 打开仓库根目录。
2. 打开 `assets/scenes/Main.scene`。
3. 预览运行。

## 如果 Main.scene 无法直接打开（序列化差异）
最小补救步骤（仅一次）：
1. 新建 `Main.scene`
2. 创建 `Canvas`
3. 创建 `MainRoot`（Canvas 下）并挂 `GameMainController`
4. 运行

## 黑屏/错位排查
- 看 Console：
  - `[GameMainController] start`
  - `[App] bootstrap completed`
  - `[GameMainController] show home/show battle/show result`
- 看布局日志：`[SceneUIFactory] fullscreen root prepared...`
- 若 UI 偏左下角，确认 `MainRoot` 挂的是 `GameMainController`，并观察是否打印了 fullscreen 修复日志。

## Missing Script 排查
- 脚本类名是否与文件一致（如 `GameMainController`）
- 工程是否完整复制 `assets/scripts`
- 打开 Cocos 后执行 reimport

## LocalStorage 清理
- 浏览器预览模式：在 DevTools 清理 LocalStorage
- 重新运行后会重新走默认 progression/fallback

## Config fallback 说明
当 JSON 读取失败或表为空时，`ConfigManager` 会注入最小 fallback：
- rules/buildings/events/residents/report_titles 均至少 3 条

## 单场景页面切换
`GameMainController` 在同一场景内切换页面，不依赖 `Home.scene/Battle.scene/Result.scene`。
