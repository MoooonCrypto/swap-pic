import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import './globals.css'
import { LocaleProvider } from '@/components/LocaleProvider'
import { PendingBottleBanner } from '@/components/PendingBottleBanner'
import { getLocaleFromCookie, getLocaleFromAcceptLanguage, type Locale } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'BottleSwap',
  description: 'Send a photo to a stranger. Receive one back. Anonymous photo exchange.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ),
}

async function getMessages(locale: Locale) {
  const msgs = await import(`@/messages/${locale}.json`)
  return msgs.default
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value ?? null
  const fromCookie = getLocaleFromCookie(localeCookie ? `locale=${localeCookie}` : null)
  let locale: Locale
  if (fromCookie) {
    locale = fromCookie
  } else {
    const headerStore = await headers()
    locale = getLocaleFromAcceptLanguage(headerStore.get('accept-language'))
  }
  const messages = await getMessages(locale)

  return (
    <html lang={locale} className="h-full">
      <body className="min-h-full flex flex-col">
        <LocaleProvider initialLocale={locale} initialMessages={messages}>
          {children}
          <PendingBottleBanner />
        </LocaleProvider>
      </body>
    </html>
  )
}
