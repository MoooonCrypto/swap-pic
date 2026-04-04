export const locales = ['ja', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ja'

export function getLocaleFromCookie(cookieHeader: string | null): Locale {
  const match = cookieHeader?.match(/locale=([a-z]{2})/)
  const lang = match?.[1]
  if (lang && locales.includes(lang as Locale)) return lang as Locale
  return defaultLocale
}
