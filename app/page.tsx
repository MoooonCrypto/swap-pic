'use client'

import { OceanBackground } from '@/components/OceanBackground'
import { BottleSVG } from '@/components/BottleSVG'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslation } from '@/lib/useTranslation'
import Link from 'next/link'

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4">
      <OceanBackground />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 flex justify-between items-center px-6 py-4 z-50">
        <div
          className="text-xl tracking-[0.15em] font-light"
          style={{ color: 'var(--ocean-foam)', fontFamily: 'Georgia, serif' }}
        >
          BottleSwap
        </div>
        <LanguageSwitcher />
      </header>

      {/* Hero section */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto mt-16">
        {/* Floating bottle */}
        <div className="animate-float mb-8">
          <BottleSVG hasImage={false} size={80} />
        </div>

        <h1
          className="text-4xl md:text-6xl font-light mb-4 leading-tight"
          style={{
            color: 'var(--sand)',
            textShadow: '0 2px 20px rgba(78,205,196,0.3)',
            letterSpacing: '0.02em',
          }}
        >
          {t('home.tagline')}
        </h1>

        <p
          className="text-base md:text-lg mb-10 max-w-md leading-relaxed whitespace-pre-line"
          style={{ color: 'var(--sand-dark)', fontFamily: 'Georgia, serif' }}
        >
          {t('home.sub')}
        </p>

        <Link
          href="/send"
          className="group relative px-10 py-4 text-lg tracking-widest transition-all duration-300 hover:scale-105 animate-pulse-glow"
          style={{
            background: 'linear-gradient(135deg, rgba(13,124,114,0.8), rgba(78,205,196,0.6))',
            border: '1px solid rgba(78,205,196,0.5)',
            borderRadius: '4px',
            color: 'var(--sand)',
            fontFamily: 'Georgia, serif',
            letterSpacing: '0.2em',
          }}
        >
          {t('home.cta')}
          <span
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded"
            style={{ background: 'rgba(78,205,196,0.1)' }}
          />
        </Link>

        {/* How it works */}
        <div className="mt-20 w-full">
          <h2
            className="text-sm tracking-[0.3em] uppercase mb-8"
            style={{ color: 'var(--ocean-foam)', opacity: 0.7 }}
          >
            {t('home.howTitle')}
          </h2>
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[
              { step: '01', text: t('home.how1'), icon: '📷' },
              { step: '02', text: t('home.how2'), icon: '🌊' },
              { step: '03', text: t('home.how3'), icon: '✉️' },
            ].map(({ step, text, icon }) => (
              <div key={step} className="flex flex-col items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                  style={{
                    background: 'rgba(14,52,96,0.5)',
                    border: '1px solid rgba(78,205,196,0.2)',
                  }}
                >
                  {icon}
                </div>
                <span
                  className="text-xs font-mono"
                  style={{ color: 'var(--ocean-foam)', opacity: 0.5 }}
                >
                  {step}
                </span>
                <p
                  className="text-xs md:text-sm text-center leading-relaxed"
                  style={{ color: 'var(--sand-dark)' }}
                >
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <p
          className="mt-12 text-xs max-w-sm text-center leading-relaxed"
          style={{ color: 'var(--sand-dark)', opacity: 0.5 }}
        >
          {t('home.note')}
        </p>
      </div>

      {/* Bottom fade */}
      <div
        className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(transparent, rgba(6,13,26,0.8))' }}
      />
    </main>
  )
}
