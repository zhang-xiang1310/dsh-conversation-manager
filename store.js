/**
 * SQLite store for the conversation manager.
 *
 * The database file may be shared by several bundles, so this module owns only
 * the `hidden_sessions` table and its own row in the shared `schema_migrations`
 * ledger. Install order does not matter, and a recorded version ABOVE the one
 * this build understands refuses to run instead of misreading rows.
 *
 * Hiding is a soft delete: `deleted = 1` marks a conversation hidden from the
 * manager, `0` restores it, and the row itself is never removed.
 */

import { DatabaseSync } from 'node:sqlite'

export const STORE_VERSION = 1

const OWNER = 'conversation-manager'

const STEPS = new Map()

STEPS.set(1, (db) => {
  db.exec(`
CREATE TABLE IF NOT EXISTS hidden_sessions (
  session_id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  deleted_at INTEGER
);
CREATE INDEX IF NOT EXISTS hidden_sessions_deleted ON hidden_sessions (deleted);
`)
})

function migrate(db) {
  db.exec(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  owner TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
`)
  const row = db.prepare('SELECT version FROM schema_migrations WHERE owner = ?').get(OWNER)
  const current = row === undefined ? 0 : Number(row.version)
  if (!Number.isInteger(current) || current < 0) {
    throw new Error(`对话管理数据库记录版本损坏：${String(row.version)}`)
  }
  if (current > STORE_VERSION) {
    throw new Error(
      `对话管理数据库版本 ${current} 高于本插件支持的 ${STORE_VERSION}，请更新插件后再使用（数据库：${db.location ?? 'records.db'}）`,
    )
  }
  for (let version = current + 1; version <= STORE_VERSION; version += 1) {
    const step = STEPS.get(version)
    if (step === undefined) throw new Error(`对话管理数据库缺少迁移步骤 ${version}`)
    db.exec('BEGIN')
    try {
      step(db)
      db
        .prepare(
          'INSERT INTO schema_migrations (owner, version, updated_at) VALUES (?, ?, ?) ON CONFLICT(owner) DO UPDATE SET version = excluded.version, updated_at = excluded.updated_at',
        )
        .run(OWNER, version, Date.now())
      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      throw error
    }
  }
}

export function openHiddenStore(file) {
  const db = new DatabaseSync(file)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA busy_timeout = 3000')
  migrate(db)

  const selectHidden = db.prepare(
    'SELECT session_id FROM hidden_sessions WHERE deleted = 1 ORDER BY deleted_at DESC, session_id',
  )
  const hideStmt = db.prepare(
    'INSERT INTO hidden_sessions (session_id, created_at, deleted, deleted_at) VALUES (?, ?, 1, ?) ON CONFLICT(session_id) DO UPDATE SET deleted = 1, deleted_at = excluded.deleted_at',
  )
  const restoreStmt = db.prepare('UPDATE hidden_sessions SET deleted = 0, deleted_at = ? WHERE session_id = ? AND deleted = 1')
  const importStmt = db.prepare(
    'INSERT OR IGNORE INTO hidden_sessions (session_id, created_at, deleted, deleted_at) VALUES (?, ?, 1, ?)',
  )

  return {
    close() {
      try {
        db.close()
      } catch {
        /* already closed */
      }
    },

    list() {
      return selectHidden.all().map(row => row.session_id)
    },

    hide(sessionId) {
      const now = Date.now()
      hideStmt.run(sessionId, now, now)
    },

    restore(sessionId) {
      return Number(restoreStmt.run(Date.now(), sessionId).changes)
    },

    /** One-time import of ids that used to live in browser storage; ignores existing rows. */
    importMissing(sessionIds) {
      const now = Date.now()
      let imported = 0
      for (const raw of sessionIds) {
        if (typeof raw !== 'string' || raw.trim() === '') continue
        imported += Number(importStmt.run(raw, now, now).changes)
      }
      return imported
    },
  }
}
