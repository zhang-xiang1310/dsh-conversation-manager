window.__ModuleLoader__.load({
  id: '@local/dsh-conversation-manager',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'conversationManager';
    const PANEL_ID = 'conversation-manager';
    const HIDDEN_STORAGE_KEY = 'dsh-conversation-manager.hidden-sessions.v1';

    const zh = {
      panel: '对话管理',
      title: '对话管理',
      subtitle: '按工作区查看全部对话，归档后仍可在此取消归档。',
      'workspace.defaultName': '默认工作区',
      'workspace.unnamed': '未命名工作区',
      ungrouped: '未分组',
      archived: '已归档',
      archive: '归档',
      unarchive: '取消归档',
      hideAction: '从管理界面隐藏（不会删除会话）',
      hiddenCount: '已从此管理界面隐藏 {count} 条对话',
      restoreOne: '恢复',
      hiddenLoadFailed: '读取隐藏记录失败：{message}',
      hideFailed: '隐藏失败：{message}',
      restoreFailed: '恢复隐藏记录失败：{message}',
      unnamed: '未命名',
      empty: '暂无对话',
      loading: '正在加载对话…',
      loadFailed: '加载对话失败：{message}',
      archiveFailed: '归档失败：{message}',
      unarchiveFailed: '取消归档失败：{message}',
      'stop.title': '该会话仍在运行',
      'stop.desc': '归档“{title}”会先停止其中正在运行的工作，且停止后不会自动恢复。',
      'stop.action': '停止并归档',
      cancel: '取消',
    };

    const en = {
      panel: 'Conversation manager',
      title: 'Conversation manager',
      subtitle: 'Browse every conversation by workspace; archived conversations can be restored here.',
      'workspace.defaultName': 'Default workspace',
      'workspace.unnamed': 'Unnamed workspace',
      ungrouped: 'Ungrouped',
      archived: 'Archived',
      archive: 'Archive',
      unarchive: 'Unarchive',
      hideAction: 'Hide from this manager (does not delete the conversation)',
      hiddenCount: 'Hidden from this manager: {count}',
      restoreOne: 'Restore',
      hiddenLoadFailed: 'Failed to read hidden records: {message}',
      hideFailed: 'Hide failed: {message}',
      restoreFailed: 'Failed to restore hidden records: {message}',
      unnamed: 'Untitled',
      empty: 'No conversations',
      loading: 'Loading conversations…',
      loadFailed: 'Failed to load conversations: {message}',
      archiveFailed: 'Archive failed: {message}',
      unarchiveFailed: 'Unarchive failed: {message}',
      'stop.title': 'This session is still running',
      'stop.desc': 'Archiving “{title}” stops its running work first, and that work will not resume automatically.',
      'stop.action': 'Stop and archive',
      cancel: 'Cancel',
    };

    const CSS = `
.dsh-cm-page { box-sizing: border-box; height: 100%; overflow-y: auto; padding: 32px 24px 48px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); }
.dsh-cm-head { max-width: 880px; margin: 0 auto 24px; }
.dsh-cm-title { margin: 0 0 6px; font-size: 22px; line-height: 30px; font-weight: 600; }
.dsh-cm-subtitle { margin: 0; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }
.dsh-cm-groups { max-width: 880px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.dsh-cm-group { border: 1px solid var(--dsw-alias-border-l1); border-radius: var(--dsw-radius-md, 8px); background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
.dsh-cm-group-head { display: flex; align-items: baseline; gap: 10px; padding: 12px 14px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.dsh-cm-group-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 600; white-space: nowrap; }
.dsh-cm-group-path { min-width: 0; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; }
.dsh-cm-list { list-style: none; margin: 0; padding: 0; }
.dsh-cm-row { padding: 0 8px 0 14px; }
.dsh-cm-row + .dsh-cm-row { border-top: 1px solid var(--dsw-alias-border-l1); }
.dsh-cm-row-main { min-height: 42px; display: flex; align-items: center; gap: 8px; }
.dsh-cm-row-title { flex: 1; min-width: 0; font-size: 13px; line-height: 20px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; }
.dsh-cm-row-archived .dsh-cm-row-title { color: var(--dsw-alias-label-secondary); }
.dsh-cm-badge { flex: none; padding: 0 6px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; color: var(--dsw-alias-label-secondary); font-size: 11px; line-height: 17px; }
.dsh-cm-row-actions { flex: none; display: flex; align-items: center; gap: 2px; }
.dsh-cm-icon-button { flex: none; width: 28px; height: 28px; padding: 0; border: none; border-radius: var(--dsw-radius-sm, 6px); background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.dsh-cm-icon-button:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.dsh-cm-icon-button:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.dsh-cm-icon-button:disabled { opacity: 0.45; cursor: default; }
.dsh-cm-state { max-width: 880px; margin: 40px auto; padding: 24px; text-align: center; color: var(--dsw-alias-label-secondary); font-size: 13px; }
.dsh-cm-error { max-width: 880px; margin: 0 auto 16px; padding: 10px 12px; border: 1px solid var(--dsw-alias-state-error-primary); border-radius: var(--dsw-radius-sm, 6px); color: var(--dsw-alias-state-error-primary); font-size: 12px; line-height: 18px; white-space: pre-wrap; }
.dsh-cm-stop { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin: 0 0 10px; padding: 10px 12px; border: 1px solid var(--dsw-alias-state-warn-primary); border-radius: var(--dsw-radius-sm, 6px); background: var(--dsw-alias-bg-layer-2); }
.dsh-cm-stop-text { min-width: 220px; flex: 1; display: flex; flex-direction: column; gap: 2px; font-size: 12px; line-height: 18px; }
.dsh-cm-stop-text strong { font-size: 13px; }
.dsh-cm-stop-text span { color: var(--dsw-alias-label-secondary); }
.dsh-cm-stop-actions { display: flex; gap: 8px; }
.dsh-cm-button { padding: 5px 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-sm, 6px); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font-size: 12px; line-height: 18px; cursor: pointer; }
.dsh-cm-button:hover:not(:disabled) { background: var(--dsw-alias-bg-layer-2); }
.dsh-cm-button:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.dsh-cm-button:disabled { opacity: 0.45; cursor: default; }
.dsh-cm-button-warn { color: var(--dsw-alias-state-warn-primary); border-color: var(--dsw-alias-state-warn-primary); }
.dsh-cm-hidden { max-width: 880px; margin: 20px auto 0; border: 1px solid var(--dsw-alias-border-l1); border-radius: var(--dsw-radius-md, 8px); background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
.dsh-cm-hidden-toggle { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; border: none; background: transparent; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; text-align: left; cursor: pointer; }
.dsh-cm-hidden-toggle:hover { color: var(--dsw-alias-label-primary); }
.dsh-cm-hidden-toggle:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }
.dsh-cm-hidden-label { min-width: 0; }
.dsh-cm-hidden-list { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--dsw-alias-border-l1); }
.dsh-cm-hidden-row { display: flex; align-items: center; gap: 8px; min-height: 38px; padding: 0 8px 0 14px; }
.dsh-cm-hidden-row + .dsh-cm-hidden-row { border-top: 1px solid var(--dsw-alias-border-l1); }
.dsh-cm-hidden-title { flex: 1; min-width: 0; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; }
.dsh-cm-restore-button { flex: none; padding: 3px 8px; }
@media (max-width: 640px) { .dsh-cm-page { padding: 20px 12px 32px; } .dsh-cm-group-head { flex-direction: column; gap: 2px; } }
`;

    function baseName(path) {
      if (typeof path !== 'string') return '';
      const parts = path.split(/[\\/]+/).filter((part) => part !== '');
      return parts.length === 0 ? '' : parts[parts.length - 1];
    }

    function errorMessage(error) {
      if (error instanceof Error && error.message !== '') return error.message;
      if (error && typeof error.message === 'string' && error.message !== '') return error.message;
      if (typeof error === 'string' && error !== '') return error;
      return 'unknown error';
    }

    async function callApi(method, payload) {
      let response;
      try {
        response = await fetch('/dsh-cm/api/' + method, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload ?? {}),
        });
      } catch (error) {
        throw new Error('无法连接对话管理服务：' + errorMessage(error));
      }
      let body;
      try {
        body = await response.json();
      } catch {
        body = null;
      }
      if (!response.ok || body === null || body.ok !== true) {
        const reason = body !== null && body.error && typeof body.error.message === 'string'
          ? body.error.message
          : 'HTTP ' + response.status;
        throw new Error(reason);
      }
      return body.value;
    }

    /** Only read once, to migrate the pre-database hidden ids; never written again. */
    function readLegacyHidden() {
      try {
        if (typeof window === 'undefined' || !window.localStorage) {
          return { ids: [], error: 'localStorage is unavailable' };
        }
        const raw = window.localStorage.getItem(HIDDEN_STORAGE_KEY);
        if (raw === null || raw === '') return { ids: [], error: null };
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          return { ids: [], error: 'stored hidden-session value is not an array' };
        }
        const ids = [];
        for (const value of parsed) {
          if (typeof value === 'string' && value !== '') ids.push(value);
        }
        return { ids, error: null };
      } catch (error) {
        return { ids: [], error: errorMessage(error) };
      }
    }

    function clearLegacyHidden() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(HIDDEN_STORAGE_KEY);
        }
      } catch {
        /* storage unavailable */
      }
    }

    function workspaceTitle(workspace, t) {
      if (workspace.title === 'default-workspace') return t('workspace.defaultName');
      if (typeof workspace.title === 'string' && workspace.title !== '') return workspace.title;
      const base = baseName(workspace.path);
      if (base !== '') return base;
      if (typeof workspace.path === 'string' && workspace.path !== '') return workspace.path;
      return t('workspace.unnamed');
    }

    function ArchiveIcon({ size = 16 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
      },
        h('path', {
          d: 'M2.5 3h11v2.5h-11zM3.5 5.5v7h9v-7M6.25 8.25h3.5',
          stroke: 'currentColor',
          strokeWidth: 1.25,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        })
      );
    }

    function UnarchiveIcon({ size = 16 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
      },
        h('path', {
          d: 'M2.5 3h11v2.5h-11zM3.5 5.5v7h9v-7M8 11.25V7.5M6.5 9 8 7.5 9.5 9',
          stroke: 'currentColor',
          strokeWidth: 1.25,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        })
      );
    }

    function TrashIcon({ size = 16 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
      },
        h('path', {
          d: 'M3.5 4.5h9M6.5 4.5V3h3v1.5M4.5 4.5l.6 8h5.8l.6-8M6.5 7v3.5M9.5 7v3.5',
          stroke: 'currentColor',
          strokeWidth: 1.25,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        })
      );
    }

    function ChevronIcon({ open, size = 14 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
        style: {
          flex: 'none',
          transform: open ? 'rotate(90deg)' : 'none',
          transition: 'transform .15s',
        },
      },
        h('path', {
          d: 'M6 3.5 10.5 8 6 12.5',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        })
      );
    }

    function ConversationManagerIcon({ size = 16 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
      },
        h('path', {
          d: 'M2.75 3.25h10.5v7.2H6.4L4.1 12.6v-2.15H2.75z',
          stroke: 'currentColor',
          strokeWidth: 1.25,
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M5.2 5.6h5.6M5.2 7.9h3.9',
          stroke: 'currentColor',
          strokeWidth: 1.25,
          strokeLinecap: 'round',
        })
      );
    }

    function ConversationManagerPage({ useSessions, useWorkspaces, archiveSession, unarchiveSession, t }) {
      const sessionRows = useSessions((state) => state.byId);
      const sessionOrder = useSessions((state) => state.ids);
      const sessionPhase = useSessions((state) => state.phase);
      const workspaceItems = useWorkspaces((state) => state.items);
      const archivedIds = useWorkspaces((state) => state.archivedSessionIds);
      const workspacePhase = useWorkspaces((state) => state.phase);
      const workspaceState = useWorkspaces((state) => state.state);
      const workspaceError = useWorkspaces((state) => state.error);

      const [busyId, setBusyId] = React.useState(null);
      const [actionError, setActionError] = React.useState(null);
      const [stopPrompt, setStopPrompt] = React.useState(null);
      const [hidden, setHidden] = React.useState({ ids: new Set(), error: null });
      const [hiddenPhase, setHiddenPhase] = React.useState('pending');
      const [hiddenOpen, setHiddenOpen] = React.useState(false);
      const [storageError, setStorageError] = React.useState(null);

      React.useEffect(() => {
        let cancelled = false;
        (async () => {
          try {
            const legacy = readLegacyHidden();
            if (legacy.ids.length > 0) {
              await callApi('import', { ids: legacy.ids });
              clearLegacyHidden();
            } else if (legacy.error === null) {
              clearLegacyHidden();
            }
            const value = await callApi('list', {});
            if (cancelled) return;
            setHidden({ ids: new Set(Array.isArray(value.ids) ? value.ids : []), error: legacy.error });
            setHiddenPhase('ready');
          } catch (error) {
            if (cancelled) return;
            setHidden((prev) => ({ ids: prev.ids, error: errorMessage(error) }));
            setHiddenPhase('ready');
          }
        })();
        return () => {
          cancelled = true;
        };
      }, []);

      const currentId = React.useMemo(() => {
        const rows = Object.values(sessionRows);
        for (const row of rows) {
          if (row && row.retainedBy && (row.retainedBy.mainView ?? 0) > 0) return row.id;
        }
        return undefined;
      }, [sessionRows]);

      const groups = React.useMemo(() => {
        const archived = new Set(archivedIds);
        const hiddenIds = hidden.ids;
        const seen = new Set();

        const isVisible = (id) => {
          const row = sessionRows[id];
          return row !== undefined && row.blank !== true && row.origin !== 'subagent';
        };

        const rowsFor = (ids) => {
          const active = [];
          const archivedRows = [];
          for (const id of ids) {
            if (seen.has(id)) continue;
            seen.add(id);
            if (hiddenIds.has(id) || !isVisible(id)) continue;
            const row = sessionRows[id];
            const item = {
              id,
              title: row.title || t('unnamed'),
              archived: archived.has(id),
            };
            if (item.archived) archivedRows.push(item);
            else active.push(item);
          }
          return active.concat(archivedRows);
        };

        const result = [];
        for (const workspace of workspaceItems) {
          const rows = rowsFor(workspace.sessionIds || []);
          if (rows.length === 0) continue;
          result.push({
            key: workspace.workspaceId,
            title: workspaceTitle(workspace, t),
            path: workspace.path,
            rows,
          });
        }

        if (currentId !== undefined) {
          let currentWorkspaceId;
          for (const workspace of workspaceItems) {
            if (Array.isArray(workspace.sessionIds) && workspace.sessionIds.includes(currentId)) {
              currentWorkspaceId = workspace.workspaceId;
              break;
            }
          }
          if (currentWorkspaceId !== undefined) {
            const index = result.findIndex((group) => group.key === currentWorkspaceId);
            if (index > 0) {
              const [group] = result.splice(index, 1);
              result.unshift(group);
            }
          }
        }

        const ungroupedRows = rowsFor(sessionOrder);
        if (ungroupedRows.length > 0) {
          result.push({
            key: 'ungrouped',
            title: t('ungrouped'),
            path: undefined,
            rows: ungroupedRows,
          });
        }
        return result;
      }, [archivedIds, currentId, hidden.ids, sessionOrder, sessionRows, t, workspaceItems]);

      const runArchive = React.useCallback(async (row, options) => {
        setActionError(null);
        setBusyId(row.id);
        try {
          if (row.archived) await unarchiveSession(row.id);
          else await archiveSession(row.id, options);
          setStopPrompt(null);
        } catch (error) {
          const code = error && error.rpcError ? error.rpcError.code : error && error.code;
          if (!row.archived && code === 'workspace/session-active') {
            setActionError(null);
            setStopPrompt({ id: row.id, title: row.title });
          } else {
            setActionError({
              key: row.archived ? 'unarchiveFailed' : 'archiveFailed',
              message: errorMessage(error),
            });
          }
        } finally {
          setBusyId(null);
        }
      }, [archiveSession, unarchiveSession]);

      const requestArchive = (row) => {
        setStopPrompt(null);
        runArchive(row);
      };

      const confirmStop = () => {
        if (stopPrompt === null) return;
        const row = { id: stopPrompt.id, title: stopPrompt.title, archived: false };
        setStopPrompt(null);
        runArchive(row, { stopActivity: true });
      };

      const hideSession = async (row) => {
        const previous = hidden.ids;
        const next = new Set(previous);
        next.add(row.id);
        setStopPrompt(null);
        setHidden({ ids: next, error: null });
        setStorageError(null);
        try {
          await callApi('hide', { sessionId: row.id });
        } catch (error) {
          setHidden({ ids: previous, error: null });
          setStorageError({ key: 'hideFailed', message: errorMessage(error) });
        }
      };

      const restoreHidden = async (id) => {
        const previous = hidden.ids;
        const next = new Set(previous);
        next.delete(id);
        setHidden({ ids: next, error: null });
        setStorageError(null);
        if (next.size === 0) setHiddenOpen(false);
        try {
          await callApi('restore', { sessionId: id });
        } catch (error) {
          setHidden({ ids: previous, error: null });
          if (previous.size > 0) setHiddenOpen(true);
          setStorageError({ key: 'restoreFailed', message: errorMessage(error) });
        }
      };

      const loading = workspacePhase === 'pending' || sessionPhase === 'pending' || hiddenPhase === 'pending';
      const loadError = workspaceState === 'error' ? workspaceError : undefined;
      const loadErrorBanner = loadError !== undefined && groups.length > 0
        ? h('div', { className: 'dsh-cm-error', role: 'alert' }, t('loadFailed', { message: errorMessage(loadError) }))
        : null;
      const hiddenLoadErrorBanner = hidden.error === null
        ? null
        : h('div', { className: 'dsh-cm-error', role: 'alert' }, t('hiddenLoadFailed', { message: hidden.error }));
      const actionErrorBanner = actionError === null
        ? null
        : h('div', { className: 'dsh-cm-error', role: 'alert' }, t(actionError.key, { message: actionError.message }));
      const storageErrorBanner = storageError === null
        ? null
        : h('div', { className: 'dsh-cm-error', role: 'alert' }, t(storageError.key, { message: storageError.message }));
      const hiddenSection = hidden.ids.size === 0
        ? null
        : h('section', { className: 'dsh-cm-hidden' },
            h('button', {
              type: 'button',
              className: 'dsh-cm-hidden-toggle',
              'aria-expanded': hiddenOpen ? 'true' : 'false',
              onClick: () => setHiddenOpen((open) => !open),
            },
              h('span', { className: 'dsh-cm-hidden-label' }, t('hiddenCount', { count: hidden.ids.size })),
              h(ChevronIcon, { open: hiddenOpen })
            ),
            hiddenOpen ? h('ul', { className: 'dsh-cm-hidden-list' }, Array.from(hidden.ids).map((id) => {
              const row = sessionRows[id];
              const title = row === undefined ? id : (row.title || t('unnamed'));
              const archived = archivedIds.includes(id);
              return h('li', { key: id, className: 'dsh-cm-hidden-row' },
                h('span', { className: 'dsh-cm-hidden-title', title }, title),
                archived ? h('span', { className: 'dsh-cm-badge' }, t('archived')) : null,
                h('button', {
                  type: 'button',
                  className: 'dsh-cm-button dsh-cm-restore-button',
                  onClick: () => restoreHidden(id),
                }, t('restoreOne'))
              );
            })) : null
          );

      let body;
      if (loading && groups.length === 0) {
        body = h('div', { className: 'dsh-cm-state' }, t('loading'));
      } else if (groups.length === 0) {
        body = h('div', { className: 'dsh-cm-state' },
          loadError === undefined ? t('empty') : t('loadFailed', { message: errorMessage(loadError) })
        );
      } else {
        body = h('div', { className: 'dsh-cm-groups' }, groups.map((group) => h('section', {
          key: group.key,
          className: 'dsh-cm-group',
          'aria-label': group.title,
        },
          h('div', { className: 'dsh-cm-group-head' },
            h('h2', { className: 'dsh-cm-group-title' }, group.title),
            group.path === undefined ? null : h('span', { className: 'dsh-cm-group-path', title: group.path }, group.path)
          ),
          h('ul', { className: 'dsh-cm-list' }, group.rows.map((row) => {
            const busy = busyId === row.id;
            const promptOpen = stopPrompt !== null && stopPrompt.id === row.id;
            return h('li', {
              key: row.id,
              className: row.archived ? 'dsh-cm-row dsh-cm-row-archived' : 'dsh-cm-row',
            },
              h('div', { className: 'dsh-cm-row-main' },
                h('span', { className: 'dsh-cm-row-title', title: row.title }, row.title),
                row.archived ? h('span', { className: 'dsh-cm-badge' }, t('archived')) : null,
                h('div', { className: 'dsh-cm-row-actions' },
                  h('button', {
                    type: 'button',
                    className: 'dsh-cm-icon-button',
                    'aria-label': row.archived ? t('unarchive') : t('archive'),
                    title: row.archived ? t('unarchive') : t('archive'),
                    disabled: busy,
                    'aria-busy': busy ? 'true' : undefined,
                    onClick: () => requestArchive(row),
                  }, row.archived ? h(UnarchiveIcon, { size: 16 }) : h(ArchiveIcon, { size: 16 })),
                  row.archived ? h('button', {
                    type: 'button',
                    className: 'dsh-cm-icon-button',
                    'aria-label': t('hideAction'),
                    title: t('hideAction'),
                    disabled: busy,
                    onClick: () => hideSession(row),
                  }, h(TrashIcon, { size: 16 })) : null
                )
              ),
              promptOpen ? h('div', { className: 'dsh-cm-stop', role: 'status' },
                h('div', { className: 'dsh-cm-stop-text' },
                  h('strong', null, t('stop.title')),
                  h('span', null, t('stop.desc', { title: row.title }))
                ),
                h('div', { className: 'dsh-cm-stop-actions' },
                  h('button', {
                    type: 'button',
                    className: 'dsh-cm-button dsh-cm-button-warn',
                    disabled: busy,
                    onClick: confirmStop,
                  }, t('stop.action')),
                  h('button', {
                    type: 'button',
                    className: 'dsh-cm-button',
                    disabled: busy,
                    onClick: () => setStopPrompt(null),
                  }, t('cancel'))
                )
              ) : null
            );
          }))
        )));
      }

      return h('main', { className: 'dsh-cm-page' },
        h('style', { key: 'dsh-cm-style' }, CSS),
        h('header', { className: 'dsh-cm-head' },
          h('h1', { className: 'dsh-cm-title' }, t('title')),
          h('p', { className: 'dsh-cm-subtitle' }, t('subtitle'))
        ),
        loadErrorBanner,
        hiddenLoadErrorBanner,
        actionErrorBanner,
        storageErrorBanner,
        body,
        hiddenSection
      );
    }

    return {
      inject: ['slots', 'locale', 'uiWorkspace'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'conversation-manager: dictionaries');
        const t = ctx.locale.bind(NS);

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: NS,
          inject: () => ({
            archiveSession: (id, options) => ctx.uiWorkspace.archiveSession(id, options),
            unarchiveSession: (id) => ctx.uiWorkspace.unarchiveSession(id),
          }),
        }, ConversationManagerPage));

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 20,
          locale: NS,
          label: () => t('panel'),
        }, ConversationManagerIcon));
      },
    };
  },
});
