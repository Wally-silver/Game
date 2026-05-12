# Weird Rule Town

## 当前状态（务必先读）

**当前仓库还不是“可直接打开即运行”的完整 Cocos Creator 3.8.8 工程。**

原因：
- Cocos `.scene` 是编辑器序列化产物，组件挂载依赖资源数据库 UUID 与导入缓存。
- 在纯文本环境中手工伪造 `Main.scene/.meta` 和脚本 `.meta` 无法保证不出现 Missing Script。
- 为避免继续误导，本次已删除所有 placeholder 场景文件，不再假装可运行。

## 入口场景

- 计划入口：`assets/scenes/Main.scene`（**需要你在 Cocos Creator 3.8.8 内创建一次真实场景**）

## 如何在 Cocos Creator 3.8.8 补齐真实场景

1. 用 Cocos Creator 3.8.8 打开项目根目录。
2. 新建场景 `assets/scenes/Main.scene`。
3. 场景中创建：`Canvas`（含 UITransform） -> 子节点 `MainRoot`（含 UITransform + Widget）。
4. 给 `MainRoot` 挂载脚本：`assets/scripts/ui/GameMainController.ts`。
5. 保存场景，确保自动生成并更新：
   - `assets/scenes/Main.scene`
   - `assets/scenes/Main.scene.meta`
   - `assets/scripts/ui/GameMainController.ts.meta`
6. 在 Project Settings / Build 或编辑器首页把启动场景设为 `Main.scene`。

## 运行

- 打开 `Main.scene` 后点击预览（Play）。

## 黑屏排查日志

优先看 Console：
- `[GameMainController] bootstrap failed`
- `[SceneUIFactory] Canvas not found, created runtime Canvas`
- `[BattleManager] rule candidates not enough`

## 清存档（调试）

在浏览器控制台执行：

```js
localStorage.removeItem('gh_town_progression_v1')
```

## 闭环验证（手动）

1. 进入 Home，点击“开始战局”。
2. 出现 3 选 1 规则弹窗，选择后看到“镇规生效”事件。
3. Battle 顶部数值变化，建筑按钮可点有反馈。
4. 达成 `goalProgress >= 100` 可提前成功结算；`order<=0` 或 `joy<=0` 失败结算；计时到 0 也可结算。
5. Result 可返回主页与“再来一局”。
