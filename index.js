/**
 * Host half of the conversation-manager bundle.
 *
 * Owns the `/dsh-cm/api` JSON routes the Client page reads and mutates through.
 * Hiding a conversation writes a row with `deleted = 1`; restoring flips it back
 * to `0`. Rows are never removed. The database lives under
 * `$DSH_HOME/plugin-data/records.db`, shared with the issue-list bundle, which
 * owns its own tables. Schema, ownership and version handling live in
 * `./store.js`.
 */

import { mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

import { openHiddenStore } from './store.js'

export const inject = ['webServer']

const API_PREFIX = '/dsh-cm/api'
const API_MATCH = '/dsh-cm/api/'
const MAX_BODY_BYTES = 4 * 1024 * 1024

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
  const store = openHiddenStore(target)

  ctx.effect(() => () => store.close(), 'conversation-manager: database')

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
              case 'list':
                value = { ids: store.list() }
                break
              case 'hide':
                store.hide(requireSessionId(payload))
                value = { hidden: true }
                break
              case 'restore':
                value = { restored: store.restore(requireSessionId(payload)) }
                break
              case 'import':
                value = { imported: store.importMissing(Array.isArray(payload.ids) ? payload.ids : []) }
                break
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
