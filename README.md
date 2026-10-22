# dsh-conversation-manager

DSH（DeepSeek Harness）对话管理面板插件。它在左侧“全局面板”区添加一个“对话管理”入口，点击后主区域切换为对话管理页：

- 按工作区分组显示对话名称；当前工作区所在的组置顶，其余工作区按侧栏既有顺序排列。
- 组内按该工作区保存的对话顺序排列；已归档对话放在同组未归档对话的下方。
- 每行末尾一个归档/取消归档符号按钮，调用 DSH 现有的 Workspace Controller，真实写入归档集合并实时回流。
- 只有已归档对话的行尾显示删除符号按钮；归档与隐藏互相独立，归档不会自动隐藏，隐藏/恢复也不会改变归档状态。
- 归档运行中的会话时，先显示“停止并归档”确认，不会自动停止工作。

> DSH 官方明确会话可归档、不可删除。本插件没有真实删除：已归档行尾的删除符号按钮只在对话管理界面隐藏该行（数据库里把 `deleted` 置 1，会话本身不动），可在页面底部展开隐藏列表后逐条恢复。归档与隐藏是两个独立动作，隐藏或恢复都不会自动归档/取消归档；隐藏已归档对话后，恢复仍回到已归档区域。

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

- 不删除会话、不影响侧栏；会话本身与其归档状态都不变。
- 归档与隐藏互不影响：隐藏不会改变归档状态，恢复也不会取消归档。
- 隐藏记录存在宿主的 SQLite 数据库 `<DSH_HOME>/plugin-data/records.db` 的 `hidden_sessions` 表：隐藏写入一行并令 `deleted = 1`，恢复改回 `deleted = 0`，行本身不删除。Client 半区通过 `POST /dsh-cm/api/{list,hide,restore,import}` 读写。
- 因此清除浏览器站点数据、更换浏览器或更换 origin/端口都不再丢失隐藏记录。
- 旧版本写在 `localStorage`（键 `dsh-conversation-manager.hidden-sessions.v1`）的记录会在首次加载时导入数据库，随后删除该键。
- 页面底部显示已隐藏数量；点击可展开隐藏列表，逐条恢复。

## 文件

| 路径 | 作用 |
| --- | --- |
| `index.js` | Host 半区：`/dsh-cm/api` JSON 路由与 `hidden_sessions` 表。 |
| `client.js` | Client 半区：`main` 主面板与 `sidebar.panellist` 入口。 |
| `cordis.patch.yml` | 向 profile 插入 `conversation-manager` 行。 |
| `locale/zh.json` / `locale/en.json` | 插件管理页的标题与描述。 |
| `icon.svg` | 插件图标。 |

## 开发与更新

插件源码即包根目录。修改 `client.js` 后重新加载当前页面即可；修改 `index.js` 需要在 `plugin_manager` 里禁用再启用本 bundle，让 Host 半区重新挂载（路由与数据库连接随之重建）。更新后如果运行中的页面仍使用旧代码，刷新页面或重启 DSH。

## License

MIT
