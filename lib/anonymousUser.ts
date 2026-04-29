'use client'

import { v4 as uuidv4 } from 'uuid'

const KEY = 'bottleswap-uid'
const PENDING_KEY = 'bottleswap-pending'
const HISTORY_KEY = 'bottleswap-history'
const MAX_HISTORY = 50

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

export interface HistoryEntry {
  myBottleId: string
  fromCountry: string | null
  date: string
}

export function saveHistoryEntry(myBottleId: string, fromCountry: string | null): void {
  if (typeof window === 'undefined') return
  const history = getHistory()
  if (history.some((e) => e.myBottleId === myBottleId)) return
  const entry: HistoryEntry = { myBottleId, fromCountry, date: new Date().toISOString() }
  const updated = [entry, ...history].slice(0, MAX_HISTORY)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as HistoryEntry[]
  } catch {
    return []
  }
}

