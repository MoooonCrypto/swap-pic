import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getPresignedUrl } from '@/lib/storage'

export async function GET(req: NextRequest) {
  const bottleId = req.nextUrl.searchParams.get('bottleId')
  const userId = req.nextUrl.searchParams.get('userId')

  if (!bottleId || !userId) {
    return NextResponse.json({ error: 'Missing params.' }, { status: 400 })
  }

  const db = getDb()

  const result = await db.execute({
    sql: `SELECT b.image_path, b.created_at,
                 mb.image_path AS matched_image,
                 mb.country_code AS from_country
          FROM bottles b
          LEFT JOIN bottles mb ON mb.id = b.matched_bottle_id
          WHERE b.id = ? AND b.user_id = ? LIMIT 1`,
    args: [bottleId, userId],
  })

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const row = result.rows[0]

  const [sentImageUrl, receivedImageUrl] = await Promise.all([
    row.image_path
      ? getPresignedUrl(row.image_path as string, 3600).catch(() => null)
      : Promise.resolve(null),
    row.matched_image
      ? getPresignedUrl(row.matched_image as string, 3600).catch(() => null)
      : Promise.resolve(null),
  ])

  return NextResponse.json({
    sentImageUrl,
    receivedImageUrl,
    fromCountry: row.from_country ?? null,
    date: row.created_at,
  })
}
