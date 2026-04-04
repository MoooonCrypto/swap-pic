'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { OceanBackground } from '@/components/OceanBackground'
import { BottleSVG } from '@/components/BottleSVG'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslation } from '@/lib/useTranslation'
import { getUserId } from '@/lib/anonymousUser'
import Link from 'next/link'

function WaitingContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useSearchParams()
  const bottleId = params.get('bottleId')
  const alreadyMatched = params.get('matched') === 'true'

  const [dots, setDots] = useState('')
  const [showDriftBottle, setShowDriftBottle] = useState(false)

  const checkStatus = useCallback(async () => {
    if (!bottleId) return
    const userId = getUserId()
    if (!userId) return

    try {
      const res = await fetch(`/api/status?bottleId=${bottleId}&userId=${userId}`)
      if (!res.ok) return
      const data = await res.json()

      if (data.status === 'matched' || data.status === 'viewed') {
        setShowDriftBottle(true)
        setTimeout(() => {
          router.push(
            `/receive?bottleId=${bottleId}&imageUrl=${encodeURIComponent(data.imageUrl || '')}&from=${data.fromCountry || ''}`
          )
        }, 2500)
      }
    } catch {
      // Network error, retry later
    }
  }, [bottleId, router])

  useEffect(() => {
    if (alreadyMatched) {
      checkStatus()
      return
    }
    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [alreadyMatched, checkStatus])

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  if (!bottleId) {
    return (
      <div className="relative z-10 flex flex-col items-center text-center">
        <p style={{ color: 'var(--sand-dark)' }}>Invalid state. <Link href="/send" className="underline">Go back</Link></p>
      </div>
    )
  }

  return (
    <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto mt-16">
      <h1
        className="text-2xl md:text-3xl font-light mb-4 tracking-wide"
        style={{ color: 'var(--sand)', letterSpacing: '0.08em' }}
      >
        {t('waiting.title')}
      </h1>

      {/* Bottles drifting */}
      <div className="relative w-64 h-64 my-8">
        {/* Your bottle drifting away */}
        <div
          className="absolute"
          style={{ left: '10%', top: '30%' }}
        >
          <div className="animate-bob opacity-60">
            <BottleSVG hasImage={true} size={50} />
          </div>
        </div>

        {/* Incoming bottle (shows when matched) */}
        {showDriftBottle && (
          <div
            className="absolute animate-drift-in"
            style={{ right: '10%', top: '20%' }}
          >
            <BottleSVG hasImage={true} size={60} />
          </div>
        )}

        {/* Wave lines */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 256 256">
          {[100, 130, 160, 190].map((y, i) => (
            <path
              key={i}
              d={`M0,${y} Q64,${y - 10} 128,${y} Q192,${y + 10} 256,${y}`}
              stroke="rgba(78,205,196,0.5)"
              strokeWidth="1"
              fill="none"
            />
          ))}
        </svg>
      </div>

      <p
        className="text-base mb-2"
        style={{ color: 'var(--sand)', fontFamily: 'Georgia, serif' }}
      >
        {showDriftBottle ? '🎉 ' : ''}{t('waiting.message')}{dots}
      </p>

      <p
        className="text-sm max-w-xs leading-relaxed mt-2"
        style={{ color: 'var(--sand-dark)', opacity: 0.6 }}
      >
        {t('waiting.sub')}
      </p>

      {/* Subtle loading indicator */}
      <div className="flex gap-2 mt-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: 'var(--ocean-foam)',
              opacity: 0.3,
              animation: `pulse-glow ${1 + i * 0.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function WaitingPage() {
  const { t } = useTranslation()

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4">
      <OceanBackground />

      <header className="fixed top-0 left-0 right-0 flex justify-between items-center px-6 py-4 z-50">
        <Link
          href="/"
          className="text-xl tracking-[0.15em] font-light transition-opacity hover:opacity-70"
          style={{ color: 'var(--ocean-foam)', fontFamily: 'Georgia, serif' }}
        >
          ながれびん
        </Link>
        <LanguageSwitcher />
      </header>

      <Suspense
        fallback={
          <div className="relative z-10 flex items-center gap-2" style={{ color: 'var(--sand-dark)' }}>
            <span>{t('waiting.checking')}</span>
          </div>
        }
      >
        <WaitingContent />
      </Suspense>
    </main>
  )
}
