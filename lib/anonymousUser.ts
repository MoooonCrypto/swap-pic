'use client'

import { v4 as uuidv4 } from 'uuid'

const KEY = 'swap-pic-uid'
const PENDING_KEY = 'swap-pic-pending'

export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = uuidv4()
    localStorage.setItem(KEY, id)
  }
  return id
}

export function getUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(KEY)
}

export interface PendingBottle {
  bottleId: string
  userId: string
  savedAt: string
}

export function savePendingBottle(bottleId: string, userId: string): void {
  if (typeof window === 'undefined') return
  const data: PendingBottle = { bottleId, userId, savedAt: new Date().toISOString() }
  localStorage.setItem(PENDING_KEY, JSON.stringify(data))
}

export function getPendingBottle(): PendingBottle | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(PENDING_KEY)
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as PendingBottle
    // 7日以上前のデータは破棄
    const age = Date.now() - new Date(data.savedAt).getTime()
    if (age > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(PENDING_KEY)
      return null
    }
    return data
  } catch {
    localStorage.removeItem(PENDING_KEY)
    return null
  }
}

export function clearPendingBottle(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PENDING_KEY)
}
