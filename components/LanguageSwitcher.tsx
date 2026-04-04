'use client'

import { useLocale } from './LocaleProvider'
import { useTranslation } from '@/lib/useTranslation'

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  const { t } = useTranslation()

  const toggle = () => setLocale(locale === 'ja' ? 'en' : 'ja')

  return (
    <button
      onClick={toggle}
      className="text-sm font-mono tracking-wider px-3 py-1 rounded border transition-all duration-200 hover:scale-105"
      style={{
        borderColor: 'rgba(78,205,196,0.4)',
        color: 'var(--ocean-foam)',
        background: 'rgba(14,52,96,0.4)',
      }}
    >
      {t('nav.lang')}
    </button>
  )
}
