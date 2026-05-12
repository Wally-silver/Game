# Weird Rule Town

当前项目为 **Cocos Creator 3.8.8 脚本工程 + Editor 初始化工具**。

## 一键初始化真实 Main.scene

1. 用 Cocos Creator 3.8.8 打开项目根目录。
2. 点击菜单：**怪话小镇 / 初始化 Main 场景**。
3. 工具会尝试自动：创建 `assets/scenes/Main.scene`、创建 Canvas、创建 MainRoot、设置基础 UI 节点并保存场景。
4. 然后打开 `assets/scenes/Main.scene`，点击预览运行。

默认不需要你手动创建 Canvas / MainRoot / UITransform / Widget。

> 若当前编辑器 API 环境下自动挂载 `GameMainController` 失败，唯一补救步骤：
> 给 `MainRoot` 手动挂载 `assets/scripts/ui/GameMainController.ts`。

## 初始化工具位置

- `extensions/weird-rule-town-bootstrap/package.json`
- `extensions/weird-rule-town-bootstrap/main.js`

## 调试

- 清存档：`localStorage.removeItem('gh_town_progression_v1')`
- 运行时检查日志关键字：`[RuntimeCheck]`
