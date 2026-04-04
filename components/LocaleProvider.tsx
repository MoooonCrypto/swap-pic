'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Locale } from '@/lib/i18n'

interface LocaleContextValue {
  locale: Locale
  messages: Record<string, unknown>
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  children,
  initialLocale,
  initialMessages,
}: {
  children: ReactNode
  initialLocale: Locale
  initialMessages: Record<string, unknown>
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [messages, setMessages] = useState<Record<string, unknown>>(initialMessages)

  const setLocale = async (newLocale: Locale) => {
    const msgs = await import(`@/messages/${newLocale}.json`)
    setMessages(msgs.default)
    setLocaleState(newLocale)
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`
  }

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <LocaleContext.Provider value={{ locale, messages, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
