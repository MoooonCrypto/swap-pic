import type { Metadata } from 'next'
import { getDb } from '@/lib/db'
import { OceanBackground } from '@/components/OceanBackground'
import { CountryFlag } from '@/components/CountryFlag'
import Link from 'next/link'

interface Props {
  params: Promise<{ bottleId: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'BottleSwap — 知らない誰かの写真が届いた',
    description: '海を漂うボトルに入った写真。あなたにも届くかもしれない。',
    openGraph: {
      title: '知らない誰かから写真が届いた 📬',
      description: 'BottleSwap — 匿名で写真を交換するサービス。あなたも瓶を流してみませんか？',
      type: 'website',
      images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: '知らない誰かから写真が届いた 📬',
      description: 'BottleSwap — 匿名で写真を交換するサービス。',
      images: ['/opengraph-image'],
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function ViewPage({ params }: Props) {
  const { bottleId } = await params

  const db = getDb()
  const result = await db.execute({
    sql: `SELECT b.status, mb.image_path, mb.country_code AS from_country
          FROM bottles b
          LEFT JOIN bottles mb ON mb.id = b.matched_bottle_id
          WHERE b.id = ? AND b.status IN ('viewed', 'deleted') LIMIT 1`,
    args: [bottleId],
  })

  const row = result.rows[0]
  const imagePath = row?.image_path as string | null
  const fromCountry = row?.from_country as string | null
  const expired = !row || !imagePath

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4">
      <OceanBackground />

      <header className="fixed top-0 left-0 right-0 flex justify-between items-center px-6 py-4 z-50">
        <Link
          href="/"
          className="text-xl tracking-[0.15em] font-light transition-opacity hover:opacity-70"
          style={{ color: 'var(--ocean-foam)', fontFamily: 'Georgia, serif' }}
        >
          BottleSwap
        </Link>
      </header>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto mt-16 px-4 w-full">
        {expired ? (
          <>
            <p
              className="text-2xl font-light mb-4"
              style={{ color: 'var(--sand)', fontFamily: 'Georgia, serif' }}
            >
              この瓶は流れ去りました
            </p>
            <p className="text-sm mb-8" style={{ color: 'var(--sand-dark)', opacity: 0.6 }}>
              This bottle has already drifted away.
            </p>
            <Link
              href="/send"
              className="px-8 py-3 text-sm rounded tracking-widest"
              style={{
                background: 'linear-gradient(135deg, rgba(13,124,114,0.9), rgba(78,205,196,0.7))',
                border: '1px solid rgba(78,205,196,0.5)',
                color: 'var(--sand)',
                letterSpacing: '0.15em',
              }}
            >
              あなたも瓶を流す
            </Link>
          </>
        ) : (
          <>
            <p
              className="text-xl font-light mb-2"
              style={{ color: 'var(--sand)', fontFamily: 'Georgia, serif' }}
            >
              知らない誰かから写真が届きました
            </p>

            {fromCountry && (
              <div
                className="flex items-center justify-center gap-2 mb-4 text-sm"
                style={{ color: 'var(--sand-dark)' }}
              >
                <span style={{ opacity: 0.6 }}>From</span>
                <CountryFlag code={fromCountry} label={fromCountry} />
              </div>
            )}

            {/* 画像 */}
            <div
              className="w-full max-w-sm rounded-lg overflow-hidden mb-6"
              style={{
                aspectRatio: '4/3',
                position: 'relative',
                boxShadow: 'inset 0 0 30px rgba(78,205,196,0.2)',
                border: '1px solid rgba(78,205,196,0.3)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/og?bottleId=${bottleId}`}
                alt="A photo from a stranger"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>

            <p className="text-xs mb-6" style={{ color: 'var(--sand-dark)', opacity: 0.4 }}>
              ⏱ この写真は24時間で消えます
            </p>

            <Link
              href="/send"
              className="px-8 py-3 text-sm rounded tracking-widest transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(13,124,114,0.9), rgba(78,205,196,0.7))',
                border: '1px solid rgba(78,205,196,0.5)',
                color: 'var(--sand)',
                letterSpacing: '0.15em',
              }}
            >
              あなたも瓶を流す
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
