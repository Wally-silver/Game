# Game - 《怪话小镇》

基于 **Cocos Creator + TypeScript** 的微信小游戏项目骨架（阶段 A）。

## 当前已完成

- 项目目录骨架（core / managers / systems / models / ui / config / utils）
- 场景文件：`Launch.scene`、`Home.scene`、`Battle.scene`、`Result.scene`
- 全局入口：`App.ts`
- 场景路由：`SceneRouter.ts`
- 事件总线：`EventBus.ts`
- 全局状态：`GameState.ts`
- 配置管理：`ConfigManager.ts`（rules/buildings/residents/events/report_titles）

## 运行说明

1. 使用 Cocos Creator 打开项目目录：`/workspace/Game`
2. 将 `Launch` 设为启动场景
3. 在启动脚本中创建 `App` 实例并传入 Cocos 场景适配器
4. 调用 `app.start()`，将自动加载配置并切换到 `Home` 场景

> 说明：当前仓库为阶段 A 工程化骨架，后续玩法系统会在阶段 B~H 逐步补充。
