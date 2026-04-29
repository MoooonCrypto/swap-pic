'use client'

import { useEffect, useState } from 'react'
import { OceanBackground } from '@/components/OceanBackground'
import { CountryFlag } from '@/components/CountryFlag'
import { useTranslation } from '@/lib/useTranslation'
import { getHistory, getUserId, type HistoryEntry } from '@/lib/anonymousUser'
import Link from 'next/link'
import Image from 'next/image'

interface HistoryImages {
  sentImageUrl: string | null
  receivedImageUrl: string | null
  fromCountry: string | null
  date: string
}

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const [images, setImages] = useState<HistoryImages | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = getUserId()
    if (!userId) { setLoading(false); return }
    fetch(`/api/history-image?bottleId=${entry.myBottleId}&userId=${userId}`)
      .then((r) => r.json())
      .then((data) => { setImages(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [entry.myBottleId])

  const date = new Date(entry.date).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(14,52,96,0.4)',
        border: '1px solid rgba(78,205,196,0.2)',
      }}
    >
      {/* Images row */}
      <div className="grid grid-cols-2">
        {(['sent', 'received'] as const).map((type) => {
          const url = type === 'sent' ? images?.sentImageUrl : images?.receivedImageUrl
          return (
            <div key={type} className="relative" style={{ aspectRatio: '1' }}>
              {loading ? (
                <div
                  className="w-full h-full animate-pulse"
                  style={{ background: 'rgba(78,205,196,0.08)' }}
                />
              ) : url ? (
                <Image src={url} alt={type} fill className="object-cover" unoptimized />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: 'rgba(78,205,196,0.05)' }}
                >
                  <span style={{ color: 'rgba(78,205,196,0.3)', fontSize: '1.5rem' }}>🌊</span>
                </div>
              )}
              <div
                className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 text-center"
                style={{
                  background: 'rgba(6,13,26,0.6)',
                  fontSize: '0.6rem',
                  color: 'rgba(232,220,200,0.5)',
                  letterSpacing: '0.05em',
                }}
              >
                {type === 'sent' ? '送った' : '届いた'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between px-3 py-2">
        <span style={{ color: 'var(--sand-dark)', fontSize: '0.7rem', opacity: 0.6 }}>
          {date}
        </span>
        {(images?.fromCountry || entry.fromCountry) && (
          <CountryFlag
            code={(images?.fromCountry || entry.fromCountry)!}
            label={(images?.fromCountry || entry.fromCountry)!}
          />
        )}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const { t } = useTranslation()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setHistory(getHistory())
    setMounted(true)
  }, [])

  return (
    <main className="relative min-h-screen flex flex-col px-4 pb-16">
      <OceanBackground />

      <header className="flex justify-between items-center px-2 py-4 z-50 relative">
        <Link
          href="/"
          className="text-xl tracking-[0.15em] font-light transition-opacity hover:opacity-70"
          style={{ color: 'var(--ocean-foam)', fontFamily: 'Georgia, serif' }}
        >
          BottleSwap
        </Link>
      </header>

      <div className="relative z-10 max-w-lg mx-auto w-full mt-4">
        <h1
          className="text-2xl font-light mb-6 tracking-wide"
          style={{ color: 'var(--sand)', letterSpacing: '0.08em' }}
        >
          {t('receive.history')}
        </h1>

        {!mounted ? null : history.length === 0 ? (
          <div className="flex flex-col items-center gap-4 mt-20 text-center">
            <p style={{ color: 'var(--sand-dark)', opacity: 0.6, fontFamily: 'Georgia, serif' }}>
              まだ交換履歴がありません
            </p>
            <Link
              href="/send"
              className="px-8 py-2.5 text-sm rounded tracking-widest"
              style={{
                background: 'linear-gradient(135deg, rgba(13,124,114,0.9), rgba(78,205,196,0.7))',
                border: '1px solid rgba(78,205,196,0.5)',
                color: 'var(--sand)',
                letterSpacing: '0.15em',
              }}
            >
              最初の瓶を流す
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {history.map((entry) => (
              <HistoryCard key={entry.myBottleId} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
