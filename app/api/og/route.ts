import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getPresignedUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'

// SNSクローラ・シェアプレビュー用の画像プロキシ
// GET /api/og?bottleId=xxx → 受信した画像バイト列を返す
export async function GET(req: NextRequest) {
  const bottleId = req.nextUrl.searchParams.get('bottleId')
  if (!bottleId) return new Response('Not found', { status: 404 })

  const db = getDb()

  try {
    const result = await db.execute({
      sql: `SELECT mb.image_path, mb.status AS matched_status
            FROM bottles b
            LEFT JOIN bottles mb ON mb.id = b.matched_bottle_id
            WHERE b.id = ? AND b.status IN ('viewed', 'deleted') LIMIT 1`,
      args: [bottleId],
    })

    const row = result.rows[0]
    const imagePath = row?.image_path as string | null

    if (!imagePath) return new Response('Not found', { status: 404 })

    const presignedUrl = await getPresignedUrl(imagePath, 300)
    const imageRes = await fetch(presignedUrl)
    if (!imageRes.ok) return new Response('Image not found', { status: 404 })

    const imageBuffer = await imageRes.arrayBuffer()
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch (e) {
    console.error('OG image error:', e)
    return new Response('Error', { status: 500 })
  }
}
