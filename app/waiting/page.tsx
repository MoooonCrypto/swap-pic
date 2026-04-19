'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { OceanBackground } from '@/components/OceanBackground'
import { BottleSVG } from '@/components/BottleSVG'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslation } from '@/lib/useTranslation'
import { getUserId, savePendingBottle } from '@/lib/anonymousUser'
import Link from 'next/link'

type Phase = 'searching' | 'matched' | 'floating' | 'error'

const MAX_WAIT = 10

function WaitingContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useSearchParams()
  const bottleId = params.get('bottleId')

  const [phase, setPhase] = useState<Phase>('searching')
  const [elapsed, setElapsed] = useState(0)
  const [msgKey, setMsgKey] = useState(0)
  const navigatingRef = useRef(false)

  const searchMessages = [
    t('waiting.search1'),
    t('waiting.search2'),
    t('waiting.search3'),
  ]

  const navigateToReceive = useCallback(
    (imageUrl: string, fromCountry: string) => {
      if (navigatingRef.current) return
      navigatingRef.current = true
      setPhase('matched')
      setTimeout(() => {
        router.push(
          `/receive?bottleId=${bottleId}&imageUrl=${encodeURIComponent(imageUrl)}&from=${fromCountry}`
        )
      }, 2200)
    },
    [bottleId, router]
  )

  // SSE接続
  useEffect(() => {
    if (!bottleId) return
    const userId = getUserId()
    if (!userId) return

    const es = new EventSource(`/api/stream?bottleId=${bottleId}&userId=${userId}`)

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.status === 'waiting') {
          setElapsed(data.elapsed ?? 0)
        } else if (data.status === 'matched') {
          es.close()
          navigateToReceive(data.imageUrl || '', data.fromCountry || '')
        } else if (data.status === 'no_match') {
          es.close()
          savePendingBottle(bottleId, userId)
          setPhase('floating')
        } else if (data.status === 'error') {
          es.close()
          setPhase('error')
        }
      } catch {}
    }

    es.onerror = () => {
      es.close()
    }

    return () => es.close()
  }, [bottleId, navigateToReceive])

  // メッセージを2.5秒ごとにローテーション
  useEffect(() => {
    if (phase !== 'searching') return
    const interval = setInterval(() => setMsgKey((k) => k + 1), 2500)
    return () => clearInterval(interval)
  }, [phase])

  if (!bottleId) {
    return (
      <div className="relative z-10 text-center">
        <p style={{ color: 'var(--sand-dark)' }}>
          Invalid state.{' '}
          <Link href="/send" className="underline">
            Go back
          </Link>
        </p>
      </div>
    )
  }

  return (
    <>
      {/* バックグラウンドを漂うボトル */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      >
        <div className="absolute animate-drift-bg-right" style={{ top: '22%', animationDelay: '0s' }}>
          <BottleSVG hasImage={false} size={34} />
        </div>
        <div className="absolute animate-drift-bg-left" style={{ top: '60%', animationDelay: '7s' }}>
          <BottleSVG hasImage={true} size={27} />
        </div>
        <div className="absolute animate-drift-bg-right" style={{ top: '42%', animationDelay: '13s' }}>
          <BottleSVG hasImage={false} size={22} />
        </div>
      </div>

      <div
        className="relative flex flex-col items-center text-center max-w-lg mx-auto mt-16 px-4"
        style={{ zIndex: 10 }}
      >
        <h1
          className="text-2xl md:text-3xl font-light mb-2 tracking-wide"
          style={{ color: 'var(--sand)', letterSpacing: '0.08em' }}
        >
          {t('waiting.title')}
        </h1>

        {/* ソナー + ボトル */}
        <div className="relative w-44 h-44 my-8 flex items-center justify-center">
          {phase === 'searching' &&
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full animate-sonar"
                style={{
                  border: '1px solid rgba(78,205,196,0.5)',
                  animationDelay: `${i * 0.7}s`,
                }}
              />
            ))}

          <div className={phase === 'searching' ? 'animate-bob' : 'animate-float'}>
            <BottleSVG hasImage={true} size={58} showCork={true} />
          </div>

          {phase === 'matched' && (
            <div className="absolute animate-drift-in" style={{ right: '-30%', top: '15%' }}>
              <BottleSVG hasImage={true} size={48} />
            </div>
          )}
        </div>

        {/* プログレスバー（10マス） */}
        {phase === 'searching' && (
          <div className="w-full max-w-[200px] mb-6">
            <div className="flex gap-1">
              {Array.from({ length: MAX_WAIT }).map((_, i) => (
                <div
                  key={i}
                  className="h-0.5 flex-1 rounded-full transition-all duration-700"
                  style={{
                    background:
                      i < elapsed ? 'rgba(78,205,196,0.8)' : 'rgba(78,205,196,0.15)',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ローテーションメッセージ */}
        {phase === 'searching' && (
          <p
            key={msgKey}
            className="text-base animate-fade-up"
            style={{
              color: 'var(--sand)',
              fontFamily: 'Georgia, serif',
              minHeight: '1.5rem',
            }}
          >
            {searchMessages[msgKey % searchMessages.length]}
          </p>
        )}

        {phase === 'matched' && (
          <p
            className="text-lg"
            style={{ color: 'var(--ocean-foam)', fontFamily: 'Georgia, serif' }}
          >
            {t('waiting.found')}
          </p>
        )}

        {phase === 'floating' && (
          <div className="flex flex-col items-center gap-3 mt-2">
            <p
              className="text-base"
              style={{ color: 'var(--sand)', fontFamily: 'Georgia, serif' }}
            >
              {t('waiting.floating')}
            </p>
            <p
              className="text-sm max-w-xs leading-relaxed text-center"
              style={{ color: 'var(--sand-dark)', opacity: 0.6 }}
            >
              {t('waiting.floatingSub')}
            </p>
            <Link
              href="/"
              className="mt-2 px-5 py-2 text-sm rounded transition-opacity hover:opacity-80"
              style={{
                background: 'rgba(78,205,196,0.1)',
                border: '1px solid rgba(78,205,196,0.3)',
                color: 'var(--ocean-foam)',
              }}
            >
              {t('waiting.goHome')}
            </Link>
          </div>
        )}

        {phase === 'error' && (
          <p className="text-sm mt-2" style={{ color: 'var(--sand-dark)', opacity: 0.6 }}>
            {t('waiting.timeout')}
          </p>
        )}

        {/* パルスドット */}
        {phase === 'searching' && (
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
        )}
      </div>
    </>
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
