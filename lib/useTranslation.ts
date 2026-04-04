'use client'

import { useCallback } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import type en from '@/messages/en.json'

type Messages = typeof en
type FlatKeys<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends object
    ? FlatKeys<T[K], `${Prefix}${K & string}.`>
    : `${Prefix}${K & string}`
}[keyof T]

type MessageKey = FlatKeys<Messages>

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return key
  }, obj) as string
}

export function useTranslation() {
  const { locale, messages } = useLocale()

  const t = useCallback(
    (key: MessageKey): string => {
      return getNestedValue(messages as Record<string, unknown>, key) ?? key
    },
    [messages]
  )

  return { t, locale }
}
