/**
 * Host half of the conversation-manager bundle.
 *
 * Owns the `/dsh-cm/api` JSON routes the Client page reads and mutates through.
 * Hiding a conversation writes a row with `deleted = 1`; restoring flips it back
 * to `0`. Rows are never removed. The database lives under
 * `$DSH_HOME/plugin-data/records.db`, shared with the issue-list bundle (each
 * owns its own table).
 */

import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export const inject = ['webServer']

const API_PREFIX = '/dsh-cm/api'
const API_MATCH = '/dsh-cm/api/'
const MAX_BODY_BYTES = 4 * 1024 * 1024

const SCHEMA = `
CREATE TABLE IF NOT EXISTS hidden_sessions (
  session_id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  deleted_at INTEGER
);
CREATE INDEX IF NOT EXISTS hidden_sessions_deleted ON hidden_sessions (deleted);
`

/* ------------------------------------------------------------------ *
 * Wire helpers (same conventions as every other /xxx/api bundle route).
 * ------------------------------------------------------------------ */

class ApiError extends Error {
  constructor(code, message, status = 400) {
    super(message)
    this.code = code
    this.status = status
  }
}

async function readJsonBody(req) {
  const chunks = []
  let total = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buffer.length
    if (total > MAX_BODY_BYTES) throw new ApiError('bad-request', 'request body too large', 400)
    chunks.push(buffer)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (text.trim() === '') return {}
  try {
    return JSON.parse(text)
  } catch {
    throw new ApiError('bad-request', 'request body is not valid JSON', 400)
  }
}

function writeJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function writeOk(res, value) {
  writeJson(res, 200, { ok: true, value })
}

function writeError(res, error) {
  if (error instanceof ApiError) {
    writeJson(res, error.status, { ok: false, error: { code: error.code, message: error.message } })
    return
  }
  writeJson(res, 500, {
    ok: false,
    error: { code: 'internal', message: error instanceof Error ? error.message : String(error) },
  })
}

function isLoopbackHostname(hostname) {
  if (hostname === 'localhost' || hostname === '[::1]') return true
  const parts = hostname.split('.')
  return (
    parts.length === 4
    && parts[0] === '127'
    && parts.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255)
  )
}

function isTrustedApiRequest(request) {
  const host = request.headers?.host
  if (typeof host !== 'string' || host === '') return false
  let hostname
  try {
    hostname = new URL(`http://${host}`).hostname
  } catch {
    return false
  }
  if (!isLoopbackHostname(hostname)) return false
  if (request.headers?.['sec-fetch-site'] === 'cross-site') return false
  const origin = request.headers?.origin
  if (origin === undefined || origin === '') return true
  try {
    return new URL(origin).hostname === hostname
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ *
 * Store location.
 * ------------------------------------------------------------------ */

function dshHome() {
  const env = process.env.DSH_HOME
  return typeof env === 'string' && env.trim() !== '' ? env : join(homedir(), '.dsh')
}

function databasePath() {
  return join(dshHome(), 'plugin-data', 'records.db')
}

function requireSessionId(payload) {
  const sessionId = payload !== null && typeof payload === 'object' ? payload.sessionId : undefined
  if (typeof sessionId !== 'string' || sessionId.trim() === '') {
    throw new ApiError('bad-request', 'sessionId is required')
  }
  return sessionId
}

export function apply(ctx) {
  const target = databasePath()
  mkdirSync(dirname(target), { recursive: true })
  const db = new DatabaseSync(target)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA busy_timeout = 3000')
  db.exec(SCHEMA)

  ctx.effect(
    () => () => {
      try {
        db.close()
      } catch {
        /* already closed */
      }
    },
    'conversation-manager: database',
  )

  const selectHidden = db.prepare('SELECT session_id FROM hidden_sessions WHERE deleted = 1 ORDER BY deleted_at, session_id')
  const hide = db.prepare(
    'INSERT INTO hidden_sessions (session_id, created_at, deleted, deleted_at) VALUES (?, ?, 1, ?) ON CONFLICT(session_id) DO UPDATE SET deleted = 1, deleted_at = excluded.deleted_at',
  )
  const restore = db.prepare('UPDATE hidden_sessions SET deleted = 0, deleted_at = ? WHERE session_id = ? AND deleted = 1')
  const importHidden = db.prepare(
    'INSERT OR IGNORE INTO hidden_sessions (session_id, created_at, deleted, deleted_at) VALUES (?, ?, 1, ?)',
  )

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'prefix',
        path: API_PREFIX,
        handler: async (req, res) => {
          if (!isTrustedApiRequest(req)) {
            writeJson(res, 403, { ok: false, error: { code: 'forbidden', message: 'forbidden' } })
            return
          }
          if (req.method !== 'POST') {
            writeJson(res, 405, { ok: false, error: { code: 'method-error', message: 'method not allowed' } })
            return
          }
          const pathname = new URL(req.url ?? '/', 'http://dsh.internal').pathname
          const method = pathname.startsWith(API_MATCH) ? pathname.slice(API_MATCH.length) : undefined
          if (method === undefined || method === '' || method.includes('/')) {
            writeError(res, new ApiError('not-found', 'unknown conversation-manager API method', 404))
            return
          }
          try {
            const payload = await readJsonBody(req)
            let value
            switch (method) {
              case 'list': {
                value = { ids: selectHidden.all().map(row => row.session_id) }
                break
              }
              case 'hide': {
                const sessionId = requireSessionId(payload)
                hide.run(sessionId, Date.now(), Date.now())
                value = { hidden: true }
                break
              }
              case 'restore': {
                const sessionId = requireSessionId(payload)
                value = { restored: Number(restore.run(Date.now(), sessionId).changes) }
                break
              }
              case 'import': {
                const ids = Array.isArray(payload.ids) ? payload.ids : []
                const now = Date.now()
                let imported = 0
                for (const raw of ids) {
                  if (typeof raw !== 'string' || raw.trim() === '') continue
                  imported += Number(importHidden.run(raw, now, now).changes)
                }
                value = { imported }
                break
              }
              default:
                throw new ApiError('not-found', `unknown conversation-manager API method "${method}"`, 404)
            }
            writeOk(res, value)
          } catch (error) {
            writeError(res, error)
          }
        },
      }),
    'conversation-manager: /dsh-cm/api routes',
  )
}
