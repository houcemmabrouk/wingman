/**
 * Global error logger — captures all browser-side errors and posts them to
 * /api/errors/log. Also caches in localStorage so the error-log page can render
 * recent entries even before the API call resolves (or if it fails).
 *
 * Hook: call installGlobalErrorLogger() once at app boot (AuthShell mount).
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const CACHE_KEY = 'wingman_system_errors'
const CACHE_MAX = 200

export type ErrorKind =
  | 'js_error'
  | 'unhandled_rejection'
  | 'fetch_failed'
  | 'fetch_error'
  | 'console_error'
  | 'react_error'

export interface SystemErrorPayload {
  source: 'frontend'
  kind: ErrorKind
  message: string
  stack?: string
  context?: Record<string, unknown>
}

export interface CachedSystemError extends SystemErrorPayload {
  id: string  // local uuid
  ts: string  // ISO
}

function localUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID()
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function trim(s: unknown, max: number): string {
  const t = typeof s === 'string' ? s : JSON.stringify(s)
  return t.length > max ? t.slice(0, max) + '…' : t
}

function readCache(): CachedSystemError[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCache(entries: CachedSystemError[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries.slice(0, CACHE_MAX)))
  } catch {
    /* quota or disabled — ignore */
  }
}

function cachePush(payload: SystemErrorPayload): CachedSystemError {
  const entry: CachedSystemError = {
    ...payload,
    id: localUuid(),
    ts: new Date().toISOString(),
  }
  const all = [entry, ...readCache()]
  writeCache(all)
  return entry
}

export function getCachedSystemErrors(): CachedSystemError[] {
  return readCache()
}

export function clearCachedSystemErrors(): void {
  writeCache([])
}

/**
 * Log a single error. Always caches; best-effort POST to backend (silently
 * dropped on network failure to avoid loops).
 */
export async function logSystemError(payload: SystemErrorPayload): Promise<void> {
  const cached = cachePush(payload)
  try {
    await fetch(`${API}/api/errors/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        source: cached.source,
        kind: cached.kind,
        message: cached.message,
        stack: cached.stack,
        context: cached.context ?? null,
      }),
    })
  } catch {
    /* ignore — already cached */
  }
}

let _installed = false

/**
 * Idempotent — wires window.onerror, unhandledrejection, console.error,
 * and a fetch wrapper that flags non-2xx responses.
 */
export function installGlobalErrorLogger(): void {
  if (_installed) return
  if (typeof window === 'undefined') return
  _installed = true

  // 1. Uncaught synchronous JS errors
  window.addEventListener('error', (event) => {
    void logSystemError({
      source: 'frontend',
      kind: 'js_error',
      message: trim(event.message || event.error?.message || 'Unknown error', 1000),
      stack: event.error?.stack ? trim(event.error.stack, 8000) : undefined,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        url: window.location.href,
      },
    })
  })

  // 2. Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const msg = reason instanceof Error ? reason.message : trim(reason, 1000)
    const stack = reason instanceof Error ? reason.stack : undefined
    void logSystemError({
      source: 'frontend',
      kind: 'unhandled_rejection',
      message: msg || 'Unhandled rejection',
      stack: stack ? trim(stack, 8000) : undefined,
      context: { url: window.location.href },
    })
  })

  // 3. console.error override (capture explicit error logs)
  const origError = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    try {
      const first = args[0]
      const message = typeof first === 'string' ? first : trim(first, 500)
      // Avoid feedback loop: skip if our own logger emitted this line
      if (!String(message).startsWith('[error-logger]')) {
        void logSystemError({
          source: 'frontend',
          kind: 'console_error',
          message: trim(message, 1000),
          context: {
            url: window.location.href,
            args_count: args.length,
            extra: args.length > 1 ? trim(args.slice(1), 500) : undefined,
          },
        })
      }
    } catch {
      /* ignore */
    }
    origError(...args)
  }

  // 4. fetch wrapper — flags non-2xx responses + network failures
  const origFetch = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url: string
    try {
      url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    } catch {
      url = '<unknown>'
    }
    // Don't log the logger's own POSTs — would create an infinite loop on outage
    const isLoggerPost = url.includes('/api/errors/log')
    try {
      const res = await origFetch(input, init)
      if (!res.ok && !isLoggerPost) {
        void logSystemError({
          source: 'frontend',
          kind: 'fetch_failed',
          message: `${init?.method || 'GET'} ${url} → HTTP ${res.status}`,
          context: {
            method: init?.method || 'GET',
            url,
            status: res.status,
            statusText: res.statusText,
            page: window.location.href,
          },
        })
      }
      return res
    } catch (err) {
      if (!isLoggerPost) {
        void logSystemError({
          source: 'frontend',
          kind: 'fetch_error',
          message: `${init?.method || 'GET'} ${url} — ${err instanceof Error ? err.message : 'network error'}`,
          stack: err instanceof Error && err.stack ? trim(err.stack, 4000) : undefined,
          context: {
            method: init?.method || 'GET',
            url,
            page: window.location.href,
          },
        })
      }
      throw err
    }
  }
}
