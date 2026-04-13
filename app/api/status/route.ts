import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { tryMatch } from '@/lib/matching'
import { getPresignedUrl } from '@/lib/storage'

export async function GET(req: NextRequest) {
  const bottleId = req.nextUrl.searchParams.get('bottleId')
  const userId = req.nextUrl.searchParams.get('userId')

  if (!bottleId || !userId) {
    return NextResponse.json({ error: 'Missing params.' }, { status: 400 })
  }

  const db = getDb()

  const result = await db.execute({
    sql: `SELECT id, user_id, status, matched_bottle_id, country_code FROM bottles
          WHERE id = ? AND user_id = ? LIMIT 1`,
    args: [bottleId, userId],
  })

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Bottle not found.' }, { status: 404 })
  }

  const bottle = result.rows[0]
  const status = bottle.status as string

  // 待機中 → マッチング再試行
  if (status === 'waiting') {
    await tryMatch(bottleId, userId)

    const refreshed = await db.execute({
      sql: `SELECT status FROM bottles WHERE id = ? LIMIT 1`,
      args: [bottleId],
    })
    if (refreshed.rows[0]?.status === 'waiting') {
      return NextResponse.json({ status: 'waiting' })
    }
    return NextResponse.json({ status: 'matched' })
  }

  // マッチング済み or 閲覧済み → 相手の画像を返す
  if ((status === 'matched' || status === 'viewed') && bottle.matched_bottle_id) {
    const matchedResult = await db.execute({
      sql: `SELECT image_path, country_code FROM bottles WHERE id = ? LIMIT 1`,
      args: [bottle.matched_bottle_id as string],
    })

    if (matchedResult.rows.length === 0) {
      return NextResponse.json({ status, imageUrl: null })
    }

    const matched = matchedResult.rows[0]
    let imageUrl: string | null = null

    if (matched.image_path) {
      try {
        imageUrl = await getPresignedUrl(matched.image_path as string, 3600)
      } catch (e) {
        console.error('Presign error:', e)
      }
    }

    // 初回閲覧時: viewed に更新 + 相手の画像に delete_ok フラグ
    if (status === 'matched') {
      const now = new Date().toISOString()
      await db.batch([
        {
          sql: `UPDATE bottles SET status = 'viewed' WHERE id = ?`,
          args: [bottleId],
        },
        {
          sql: `UPDATE bottles SET delete_ok = 1, delete_ok_at = ? WHERE id = ?`,
          args: [now, bottle.matched_bottle_id as string],
        },
      ])
    }

    return NextResponse.json({
      status: 'matched',
      imageUrl,
      fromCountry: matched.country_code ?? null,
    })
  }

  return NextResponse.json({ status })
}
