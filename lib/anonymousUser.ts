'use client'

import { v4 as uuidv4 } from 'uuid'

const KEY = 'swap-pic-uid'

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
