'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { OceanBackground } from '@/components/OceanBackground'
import { BottleSVG } from '@/components/BottleSVG'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useTranslation } from '@/lib/useTranslation'
import { getOrCreateUserId } from '@/lib/anonymousUser'
import Link from 'next/link'
import Image from 'next/image'

type Stage = 'pick' | 'preview' | 'sealing' | 'sending'

export default function SendPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('pick')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bottleSealed, setBottleSealed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    setError(null)
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError(t('error.invalidType'))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(t('error.fileTooLarge'))
      return
    }
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    setStage('preview')
  }, [t])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleSend = async () => {
    if (!imageFile) return
    setStage('sealing')
    setBottleSealed(true)

    // Small delay for animation
    await new Promise((r) => setTimeout(r, 1200))
    setStage('sending')

    try {
      const userId = getOrCreateUserId()
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('userId', userId)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        const msgKey = data.error?.includes('Too many') ? 'error.rateLimit'
          : data.error?.includes('banned') ? 'error.banned'
          : 'error.uploadFailed'
        setError(t(msgKey as Parameters<typeof t>[0]))
        setStage('preview')
        setBottleSealed(false)
        return
      }

      // Wait for send animation then navigate
      await new Promise((r) => setTimeout(r, 1800))
      router.push(
        `/waiting?bottleId=${data.bottleId}&matched=${data.matched}&seed=${data.isSeedMatch ?? false}`
      )
    } catch {
      setError(t('error.uploadFailed'))
      setStage('preview')
      setBottleSealed(false)
    }
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4">
      <OceanBackground />

      {/* Header */}
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

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto mt-16 w-full">
        <h1
          className="text-2xl md:text-3xl font-light mb-8 tracking-wide"
          style={{ color: 'var(--sand)', letterSpacing: '0.08em' }}
        >
          {t('send.title')}
        </h1>

        {/* Bottle with image visual */}
        <div
          className={`mb-8 transition-all duration-700 ${
            stage === 'sending' ? 'animate-send-away' : 'animate-float'
          }`}
        >
          <BottleSVG
            hasImage={bottleSealed}
            size={80}
            showCork={true}
          />
        </div>

        {/* Stage: pick */}
        {stage === 'pick' && (
          <div
            className={`w-full max-w-sm border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all duration-200 ${
              isDragOver ? 'drop-zone-active' : ''
            }`}
            style={{
              borderColor: 'rgba(78,205,196,0.3)',
              background: 'rgba(14,52,96,0.3)',
            }}
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
          >
            <div className="text-4xl mb-4">📷</div>
            <p className="text-sm mb-2" style={{ color: 'var(--sand)' }}>
              {t('send.dropHere')}
            </p>
            <p className="text-xs" style={{ color: 'var(--sand-dark)', opacity: 0.6 }}>
              {t('send.supportedFormats')}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        )}

        {/* Stage: preview */}
        {stage === 'preview' && imagePreview && (
          <div className="w-full max-w-sm">
            <div className="relative rounded-lg overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
              <Image
                src={imagePreview}
                alt="preview"
                fill
                className="object-cover"
                unoptimized
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(transparent 60%, rgba(6,13,26,0.6))',
                }}
              />
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setStage('pick'); setImageFile(null); setImagePreview(null) }}
                className="px-5 py-2 text-sm rounded transition-all hover:opacity-80"
                style={{
                  background: 'rgba(14,52,96,0.5)',
                  border: '1px solid rgba(78,205,196,0.2)',
                  color: 'var(--sand-dark)',
                }}
              >
                {t('send.change')}
              </button>
              <button
                onClick={handleSend}
                className="px-8 py-2 text-sm tracking-widest rounded transition-all duration-300 hover:scale-105 animate-pulse-glow"
                style={{
                  background: 'linear-gradient(135deg, rgba(13,124,114,0.9), rgba(78,205,196,0.7))',
                  border: '1px solid rgba(78,205,196,0.5)',
                  color: 'var(--sand)',
                  letterSpacing: '0.15em',
                }}
              >
                {t('send.sendBtn')}
              </button>
            </div>
          </div>
        )}

        {/* Stage: sealing / sending */}
        {(stage === 'sealing' || stage === 'sending') && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full shimmer"
                  style={{
                    background: 'var(--ocean-foam)',
                    animationDelay: `${i * 0.3}s`,
                    opacity: 0.8,
                  }}
                />
              ))}
            </div>
            <p className="text-sm" style={{ color: 'var(--sand-dark)' }}>
              {t('send.sending')}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="mt-4 px-4 py-3 rounded text-sm max-w-sm"
            style={{
              background: 'rgba(244,132,95,0.15)',
              border: '1px solid rgba(244,132,95,0.3)',
              color: '#f4845f',
            }}
          >
            {error}
          </div>
        )}

        {/* Rules */}
        <p
          className="mt-8 text-xs max-w-xs text-center"
          style={{ color: 'var(--sand-dark)', opacity: 0.4 }}
        >
          {t('send.rules')}
        </p>
      </div>
    </main>
  )
}
