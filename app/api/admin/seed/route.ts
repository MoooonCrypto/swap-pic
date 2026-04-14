import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { listImages } from '@/lib/storage'
import { getDb } from '@/lib/db'

// R2の seed/ フォルダをスキャンしてDBに未登録のシード画像を自動登録する
// POST /api/admin/seed/sync
// Authorization: Bearer {CRON_SECRET}
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // R2の seed/ プレフィックス以下を全取得
  let r2Keys: string[]
  try {
    r2Keys = await listImages('seed/')
  } catch (e) {
    console.error('R2 list error:', e)
    return NextResponse.json({ error: 'Failed to list R2 objects.' }, { status: 500 })
  }

  // 画像ファイルのみ対象（フォルダ自体や非画像を除外）
  const imageKeys = r2Keys.filter((k) =>
    /\.(jpe?g|png|gif|webp)$/i.test(k)
  )

  if (imageKeys.length === 0) {
    return NextResponse.json({ added: 0, message: 'No images found in seed/ folder.' })
  }

  const db = getDb()

  // DBに登録済みのシード画像パスを取得
  const existing = await db.execute({
    sql: `SELECT image_path FROM bottles WHERE is_seed = 1`,
    args: [],
  })
  const existingPaths = new Set(existing.rows.map((r) => r.image_path as string))

  // 未登録のみ抽出
  const newKeys = imageKeys.filter((k) => !existingPaths.has(k))

  if (newKeys.length === 0) {
    return NextResponse.json({
      added: 0,
      total: imageKeys.length,
      message: 'All seed images already registered.',
    })
  }

  // バッチINSERT
  const now = new Date().toISOString()
  await db.batch(
    newKeys.map((key) => ({
      sql: `INSERT INTO bottles (id, user_id, ip_hash, image_path, status, is_seed, delete_ok, created_at)
            VALUES (?, '__seed__', '__seed__', ?, 'waiting', 1, 0, ?)`,
      args: [uuidv4(), key, now],
    }))
  )

  return NextResponse.json({
    added: newKeys.length,
    total: imageKeys.length,
    newPaths: newKeys,
  })
}
