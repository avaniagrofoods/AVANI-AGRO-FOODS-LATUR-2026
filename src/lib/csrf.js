// ============================================================
// AVANI AGRO FOODS — CLIENT CSRF TOKEN HELPER (CC-04 / Package 3F.108)
// src/lib/csrf.js
// Provides role-separated CSRF token storage and retrieval for Gate and Affiliate portals
// ============================================================

export const GATE_CSRF_COOKIE_NAME = 'avani_csrf_token'
export const AFFILIATE_CSRF_COOKIE_NAME = 'avani_affiliate_csrf_token'
export const CSRF_COOKIE_NAME = 'avani_csrf_token'

function getStorageKeyForRole(role = 'gate') {
  return role === 'affiliate' ? 'avani_affiliate_csrf_token' : 'avani_gate_csrf_token'
}

function getCookieNameForRole(role = 'gate') {
  return role === 'affiliate' ? AFFILIATE_CSRF_COOKIE_NAME : GATE_CSRF_COOKIE_NAME
}

export function storeCsrfToken(token, role = 'gate') {
  if (!token || typeof token !== 'string') return
  const storageKey = getStorageKeyForRole(role)
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(storageKey, token)
      // Provide legacy shared alias only for gate role
      if (role === 'gate') {
        window.sessionStorage.setItem('avani_csrf_token', token)
      }
    }
  } catch {
    // Ignore storage access errors in restricted frames
  }
}

export function clearCsrfToken(role = 'gate') {
  const storageKey = getStorageKeyForRole(role)
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(storageKey)
      if (role === 'gate') {
        window.sessionStorage.removeItem('avani_csrf_token')
      }
    }
  } catch {
    // Ignore storage access errors
  }
}

export function getCsrfToken(role = 'gate') {
  const storageKey = getStorageKeyForRole(role)
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = window.sessionStorage.getItem(storageKey)
      if (stored) return stored
      if (role === 'gate') {
        const legacyStored = window.sessionStorage.getItem('avani_csrf_token')
        if (legacyStored) return legacyStored
      }
    }
  } catch {
    // Ignore storage access errors
  }

  try {
    if (typeof document !== 'undefined' && typeof document.cookie === 'string') {
      const targetCookie = getCookieNameForRole(role)
      const parts = document.cookie.split(';')
      for (const part of parts) {
        const [rawName, ...rest] = part.trim().split('=')
        if (rawName === targetCookie || (role === 'gate' && rawName === 'avani_csrf_token')) {
          return decodeURIComponent(rest.join('='))
        }
      }
    }
  } catch {
    // Ignore cookie access errors
  }

  return ''
}

export function getCsrfHeaders(extraHeaders = {}, role = 'gate') {
  const token = getCsrfToken(role)
  return {
    ...extraHeaders,
    ...(token ? { 'X-CSRF-Token': token } : {})
  }
}
