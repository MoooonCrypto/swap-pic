'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getPendingBottle, clearPendingBottle } from '@/lib/anonymousUser'

type BannerState = 'idle' | 'waiting' | 'matched'

interface MatchedData {
  imageUrl: string
  fromCountry: string
  bottleId: string
}

const SKIP_PATHS = ['/waiting', '/receive', '/view', '/history']

export function PendingBottleBanner() {
  const router = useRouter()
  const pathname = usePathname()
  const [bannerState, setBannerState] = useState<BannerState>('idle')
  const [matchedData, setMatchedData] = useState<MatchedData | null>(null)

  useEffect(() => {
    if (SKIP_PATHS.some((p) => pathname.startsWith(p))) return

    const pending = getPendingBottle()
    if (!pending) return

    fetch(`/api/status?bottleId=${pending.bottleId}&userId=${pending.userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'matched') {
          setMatchedData({
            imageUrl: data.imageUrl || '',
            fromCountry: data.fromCountry || '',
            bottleId: pending.bottleId,
          })
          setBannerState('matched')
        } else if (data.status === 'waiting') {
          setBannerState('waiting')
        } else {
          // deleted / not found / viewed → 破棄
          clearPendingBottle()
        }
      })
      .catch(() => {})
  }, [pathname])

  const handleOpen = () => {
    if (!matchedData) return
    clearPendingBottle()
    router.push(
      `/receive?bottleId=${matchedData.bottleId}&imageUrl=${encodeURIComponent(matchedData.imageUrl)}&from=${matchedData.fromCountry}`
    )
  }

  const handleDismiss = () => {
    setBannerState('idle')
  }

  if (bannerState === 'idle') return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-xl px-4 py-3 shadow-lg"
      style={{
        background: 'rgba(10,31,58,0.95)',
        border: '1px solid rgba(78,205,196,0.4)',
        backdropFilter: 'blur(12px)',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      {bannerState === 'waiting' ? (
        <>
          <p className="text-sm" style={{ color: 'var(--sand-dark)' }}>
            🍾 あなたの瓶、まだ海を漂っています…
          </p>
          <button onClick={handleDismiss} style={{ color: 'var(--sand-dark)', opacity: 0.5, fontSize: '1.1rem' }}>
            ×
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-light" style={{ color: 'var(--sand)' }}>
            📬 瓶が届いています！
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpen}
              className="px-3 py-1 text-xs rounded"
              style={{
                background: 'linear-gradient(135deg, rgba(13,124,114,0.9), rgba(78,205,196,0.7))',
                color: 'var(--sand)',
                border: '1px solid rgba(78,205,196,0.5)',
              }}
            >
              開ける
            </button>
            <button onClick={handleDismiss} style={{ color: 'var(--sand-dark)', opacity: 0.5, fontSize: '1.1rem' }}>
              ×
            </button>
          </div>
        </>
      )}
    </div>
  )
}
