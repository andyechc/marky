/**
 * Namespaced localStorage access.
 *
 * Replaces the previous base64 "obfuscation" layer, which provided no real
 * confidentiality (the key lived next to the data) and threw on any non-Latin1
 * character, silently dropping writes. Documents are stored as plain UTF-8 JSON.
 */

const PREFIX = 'marky:'
const SCHEMA_VERSION = 1

export class StorageError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = 'StorageError'
    this.cause = cause
  }
}

function fullKey(key) {
  return PREFIX + key
}

/** Detects Safari private mode / disabled storage without throwing. */
export function isStorageAvailable() {
  try {
    const probe = `${PREFIX}__probe__`
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

function isQuotaError(error) {
  return (
    error &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014)
  )
}

export const storage = {
  /**
   * Read and JSON-parse a value. Returns `fallback` when missing or corrupt,
   * so a bad entry can never take down the app.
   */
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(fullKey(key))
      if (raw === null) return fallback
      return JSON.parse(raw)
    } catch (error) {
      console.warn(`[storage] unreadable value for "${key}", ignoring:`, error)
      return fallback
    }
  },

  /** JSON-serialise and persist a value. Returns false if the write failed. */
  set(key, value) {
    try {
      localStorage.setItem(fullKey(key), JSON.stringify(value))
      return true
    } catch (error) {
      if (isQuotaError(error)) {
        throw new StorageError('No queda espacio de almacenamiento en el navegador.', error)
      }
      console.warn(`[storage] could not persist "${key}":`, error)
      return false
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(fullKey(key))
      return true
    } catch (error) {
      console.warn(`[storage] could not remove "${key}":`, error)
      return false
    }
  },

  /** Removes only this app's keys, leaving other apps' data untouched. */
  clearAll() {
    try {
      const doomed = []
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i)
        if (key && key.startsWith(PREFIX)) doomed.push(key)
      }
      doomed.forEach((key) => localStorage.removeItem(key))
      return true
    } catch (error) {
      console.warn('[storage] clearAll failed:', error)
      return false
    }
  },

  /** Approximate bytes used by this app, for the settings screen. */
  usage() {
    let bytes = 0
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i)
        if (key && key.startsWith(PREFIX)) {
          bytes += key.length + (localStorage.getItem(key)?.length ?? 0)
        }
      }
    } catch {
      /* ignore */
    }
    return bytes * 2 // UTF-16 code units
  },
}

/**
 * Validates a filename before it is used as a download name or a storage key.
 * Rejects path separators, traversal and control characters.
 */
export function validateFilename(name) {
  if (typeof name !== 'string') return false
  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 180) return false
  // eslint-disable-next-line no-control-regex
  if (/[\\/:*?"<>|\u0000-\u001f]/.test(trimmed)) return false
  if (trimmed === '.' || trimmed === '..') return false
  if (/^\.+$/.test(trimmed)) return false
  return true
}

/** Ensures a filename ends in .md, adding it when absent. */
export function withMarkdownExtension(name) {
  const trimmed = (name ?? '').trim() || 'Untitled'
  return /\.(md|markdown|txt)$/i.test(trimmed) ? trimmed : `${trimmed}.md`
}

/** Escapes text for safe interpolation into HTML. */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const STORAGE_KEYS = {
  settings: 'settings',
  documents: 'documents',
  session: 'session',
  recent: 'recent',
  schemaVersion: 'schema:version',
  // Saved AI instruction templates, plus the in-progress factor set for the
  // generator so a half-written prompt survives a reload.
  templates: 'templates',
  instructionDraft: 'instruction-draft',
}

export { SCHEMA_VERSION, PREFIX }