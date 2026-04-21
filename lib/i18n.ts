export const locales = ['ja', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ja'

export function getLocaleFromCookie(cookieHeader: string | null): Locale | null {
  const match = cookieHeader?.match(/locale=([a-z]{2})/)
  const lang = match?.[1]
  if (lang && locales.includes(lang as Locale)) return lang as Locale
  return null
}

export function getLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return defaultLocale
  const langs = header.split(',').map((s) => s.split(';')[0].trim().slice(0, 2).toLowerCase())
  for (const lang of langs) {
    if (locales.includes(lang as Locale)) return lang as Locale
  }
  return defaultLocale
}
