# 《怪话小镇》- 阶段 A（项目骨架初始化）

本仓库当前实现目标：
- Cocos Creator + TypeScript 微信小游戏项目骨架
- 模块化基础结构（core / managers / systems / models / ui / config / utils）
- 四个基础场景流程（Launch -> Home -> Battle/Result）

## 目录说明

```text
assets/
  scripts/
    core/        # App / EventBus / Constants / GameState / SceneRouter / LaunchView
    managers/    # Config / Save / UI / Audio / Battle
    systems/     # Rule / Building / Resident / Event / Report
    models/      # 各系统基础数据结构
    ui/          # Home / Battle / Result / Popup 相关脚本
    config/      # 规则、建筑、居民、事件、日报标题 mock 配置
    utils/       # Logger / WeightedRandom / MathUtil
  scenes/        # Launch / Home / Battle / Result
```

## 场景接线（在 Cocos Editor 中）

1. **Launch.scene**
   - 根节点挂 `LaunchView`
   - 同节点会在运行时自动挂 `App`（若不存在）
2. **Home.scene**
   - 挂 `HomeView`
   - 绑定按钮事件：
     - `onTapStartGame` -> Battle.scene
     - `onTapViewResult` -> Result.scene
3. **Battle.scene**
   - 挂 `BattleHUD`
   - 绑定按钮事件：`onTapBackHome`
4. **Result.scene**
   - 挂 `ResultReportView`
   - 绑定按钮事件：`onTapBackHome`

## 运行方法

1. 用 Cocos Creator 打开 `/workspace/Game`
2. 将 `Launch.scene` 设为启动场景
3. 点击预览运行，进入 Launch 后自动初始化配置并跳转 Home
4. 在 Home 点击按钮验证跳转至 Battle / Result

## 当前范围说明

- 已完成第一阶段骨架初始化与最小流程打通。
- 战斗玩法、规则生效计算、完整日报渲染属于下一阶段。
