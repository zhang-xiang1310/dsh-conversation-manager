# dsh-conversation-manager

DSH（DeepSeek Harness）对话管理面板插件。它在左侧“全局面板”区添加一个“对话管理”入口，点击后主区域切换为对话管理页：

- 按工作区分组显示对话名称；当前工作区所在的组置顶，其余工作区按侧栏既有顺序排列。
- 组内按该工作区保存的对话顺序排列；已归档对话放在同组未归档对话的下方。
- 每行末尾一个归档/取消归档符号按钮，调用 DSH 现有的 Workspace Controller，真实写入归档集合并实时回流。
- 只有已归档对话的行尾才显示删除符号按钮；它只把该对话从本管理界面隐藏，不会删除会话数据，也不影响侧栏。
- 归档运行中的会话时，先显示“停止并归档”确认，不会自动停止工作。

> DSH 官方明确会话可归档、不可删除。本插件没有真实删除：已归档行尾的删除符号按钮仅为本地隐藏，可在页面底部展开隐藏列表后逐条恢复。

## 安装

在 DSH 的 `plugin_manager` 中使用 `install_bundle`，target 传入：

```text
github:zhang-xiang1310/dsh-conversation-manager
```

也可以先把本仓库克隆到本地，再把包目录的绝对路径作为 target 安装：

```text
plugin_manager install_bundle target=D:\path\to\dsh-conversation-manager
```

安装后如果侧栏没有立即出现“对话管理”，刷新页面；仍不出现时重启 DSH。当前安装到 `desktop` profile，对所有会话生效。

## 卸载 / 重装

通过 `plugin_manager` 禁用或 `remove_bundle` 移除当前 bundle，然后重新用上面的 GitHub spec 安装即可。重装不会删除任何会话或归档数据。

## 隐藏记录

删除符号按钮只影响对话管理界面：

- 不调用 Host、不删除会话、不影响侧栏。
- 隐藏的 Session ID 保存在当前浏览器 origin 的 `localStorage`，键为 `dsh-conversation-manager.hidden-sessions.v1`。
- 页面底部显示已隐藏数量；点击可展开隐藏列表，逐条恢复。
- 清除浏览器站点数据、更换浏览器或更换 origin/端口后，隐藏记录不会保留。

## 文件

| 路径 | 作用 |
| --- | --- |
| `index.js` | Host 半区；本插件无 Host 能力，只提供 bundle row。 |
| `client.js` | Client 半区：`main` 主面板与 `sidebar.panellist` 入口。 |
| `cordis.patch.yml` | 向 profile 插入 `conversation-manager` 行。 |
| `locale/zh.json` / `locale/en.json` | 插件管理页的标题与描述。 |
| `icon.svg` | 插件图标。 |

## 开发与更新

插件源码即包根目录，修改 `client.js` 后重新安装或重新加载当前页面即可。更新后如果运行中的页面仍使用旧代码，刷新页面或重启 DSH。

## License

MIT
