import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import { LocaleProvider } from '@/components/LocaleProvider'
import { getLocaleFromCookie, type Locale } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'ながれびん / Drift Pic',
  description: '匿名で写真を交換する / Anonymous photo exchange',
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
  const locale = getLocaleFromCookie(localeCookie ? `locale=${localeCookie}` : null)
  const messages = await getMessages(locale)

  return (
    <html lang={locale} className="h-full">
      <body className="min-h-full flex flex-col">
        <LocaleProvider initialLocale={locale} initialMessages={messages}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  )
}
