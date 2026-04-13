import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { deleteImages } from '@/lib/storage'

// cron-job.org から毎日 POST で叩くエンドポイント
// Authorization: Bearer {CRON_SECRET}
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()

  // delete_ok = 1 かつ未削除のボトルを取得
  const result = await db.execute({
    sql: `SELECT id, image_path FROM bottles WHERE delete_ok = 1 AND status != 'deleted'`,
    args: [],
  })

  if (result.rows.length === 0) {
    return NextResponse.json({ deleted: 0 })
  }

  const keys = result.rows.map((r) => r.image_path as string).filter(Boolean)
  const ids = result.rows.map((r) => r.id as string)

  // R2から一括削除
  try {
    await deleteImages(keys)
  } catch (e) {
    console.error('R2 delete error:', e)
  }

  // DBのステータスを deleted に更新・image_path をクリア
  // libsql の batch で分割実行（IN句の代わり）
  await db.batch(
    ids.map((id) => ({
      sql: `UPDATE bottles SET status = 'deleted', image_path = '' WHERE id = ?`,
      args: [id],
    }))
  )

  return NextResponse.json({ deleted: ids.length })
}
