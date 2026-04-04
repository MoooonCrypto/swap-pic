'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { OceanBackground } from '@/components/OceanBackground'
import { BottleSVG } from '@/components/BottleSVG'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { CountryFlag } from '@/components/CountryFlag'
import { useTranslation } from '@/lib/useTranslation'
import Link from 'next/link'
import Image from 'next/image'

type Stage = 'arrived' | 'opening' | 'revealed'

function ReceiveContent() {
  const { t } = useTranslation()
  const params = useSearchParams()
  const imageUrl = params.get('imageUrl') || ''
  const fromCountry = params.get('from') || ''

  const [stage, setStage] = useState<Stage>('arrived')
  const [showBottle, setShowBottle] = useState(false)

  useEffect(() => {
    // Bottle drifts in
    const t1 = setTimeout(() => setShowBottle(true), 300)
    return () => clearTimeout(t1)
  }, [])

  const handleOpen = () => {
    setStage('opening')
    setTimeout(() => setStage('revealed'), 1200)
  }

  return (
    <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto mt-16 w-full px-4">
      <h1
        className="text-2xl md:text-3xl font-light mb-8 tracking-wide"
        style={{ color: 'var(--sand)', letterSpacing: '0.08em' }}
      >
        {t('receive.title')}
      </h1>

      {/* Bottle arrival */}
      {stage === 'arrived' && (
        <div className="flex flex-col items-center gap-6">
          <div className={showBottle ? 'animate-drift-in' : 'opacity-0'}>
            <BottleSVG hasImage={true} size={100} showCork={true} />
          </div>

          {showBottle && (
            <button
              onClick={handleOpen}
              className="px-10 py-3 text-base tracking-widest rounded transition-all duration-300 hover:scale-105 animate-pulse-glow"
              style={{
                background: 'linear-gradient(135deg, rgba(13,124,114,0.9), rgba(78,205,196,0.7))',
                border: '1px solid rgba(78,205,196,0.5)',
                color: 'var(--sand)',
                letterSpacing: '0.2em',
              }}
            >
              {t('receive.openBtn')}
            </button>
          )}
        </div>
      )}

      {/* Opening animation */}
      {stage === 'opening' && (
        <div className="flex flex-col items-center gap-4">
          <BottleSVG hasImage={true} size={100} showCork={true} corkPopped={true} />
          <p className="text-sm" style={{ color: 'var(--sand-dark)' }}>
            {t('receive.opening')}
          </p>
        </div>
      )}

      {/* Revealed */}
      {stage === 'revealed' && imageUrl && (
        <div className="w-full max-w-sm">
          {/* Country origin */}
          {fromCountry && (
            <div
              className="flex items-center justify-center gap-2 mb-4 text-sm animate-image-reveal"
              style={{ color: 'var(--sand-dark)' }}
            >
              <span style={{ opacity: 0.6 }}>{t('receive.from')}</span>
              <CountryFlag code={fromCountry} label={fromCountry} />
            </div>
          )}

          {/* Image reveal */}
          <div
            className="relative rounded-lg overflow-hidden animate-image-reveal"
            style={{ aspectRatio: '4/3' }}
          >
            <Image
              src={imageUrl}
              alt="received photo"
              fill
              className="object-cover"
              unoptimized
            />
            {/* Frame overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: 'inset 0 0 30px rgba(78,205,196,0.2)',
                border: '1px solid rgba(78,205,196,0.3)',
                borderRadius: '8px',
              }}
            />
          </div>

          {/* Expires notice */}
          <p
            className="mt-3 text-xs text-center"
            style={{ color: 'var(--sand-dark)', opacity: 0.5 }}
          >
            ⏱ {t('receive.expires')}
          </p>

          {/* Action */}
          <div className="mt-6">
            <Link
              href="/send"
              className="inline-block px-8 py-3 text-sm tracking-widest rounded transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(14,52,96,0.6)',
                border: '1px solid rgba(78,205,196,0.3)',
                color: 'var(--ocean-foam)',
                letterSpacing: '0.15em',
              }}
            >
              {t('receive.again')}
            </Link>
          </div>
        </div>
      )}

      {/* No image fallback */}
      {stage === 'revealed' && !imageUrl && (
        <div className="flex flex-col items-center gap-4">
          <p style={{ color: 'var(--sand-dark)' }}>Image not available.</p>
          <Link href="/" className="underline" style={{ color: 'var(--ocean-foam)' }}>
            Home
          </Link>
        </div>
      )}
    </div>
  )
}

export default function ReceivePage() {
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
          <div className="relative z-10" style={{ color: 'var(--sand-dark)' }}>
            Loading...
          </div>
        }
      >
        <ReceiveContent />
      </Suspense>
    </main>
  )
}
