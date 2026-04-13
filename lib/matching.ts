import { getDb } from './db'

export async function tryMatch(
  bottleId: string,
  userId: string
): Promise<{ matchedId: string; isSeed: boolean } | null> {
  const db = getDb()
  const now = new Date().toISOString()

  // 1. 同一ユーザー以外のリアルな待機ボトルを探す
  const realResult = await db.execute({
    sql: `SELECT id FROM bottles
          WHERE status = 'waiting' AND user_id != ? AND is_seed = 0
          ORDER BY created_at ASC LIMIT 1`,
    args: [userId],
  })

  if (realResult.rows.length > 0) {
    const candidateId = realResult.rows[0].id as string
    try {
      await db.batch([
        {
          sql: `UPDATE bottles SET status = 'matched', matched_bottle_id = ?, matched_at = ?
                WHERE id = ? AND status = 'waiting'`,
          args: [candidateId, now, bottleId],
        },
        {
          sql: `UPDATE bottles SET status = 'matched', matched_bottle_id = ?, matched_at = ?
                WHERE id = ? AND status = 'waiting'`,
          args: [bottleId, now, candidateId],
        },
      ])
      return { matchedId: candidateId, isSeed: false }
    } catch {
      return null
    }
  }

  // 2. リアルマッチなし → シードボトルにフォールバック
  const seedResult = await db.execute({
    sql: `SELECT id FROM bottles
          WHERE is_seed = 1 AND status = 'waiting'
          ORDER BY RANDOM() LIMIT 1`,
    args: [],
  })

  if (seedResult.rows.length === 0) return null

  const seedId = seedResult.rows[0].id as string

  // 自分のボトルだけ matched に更新。シードボトルは waiting のまま（再利用可能）
  await db.execute({
    sql: `UPDATE bottles SET status = 'matched', matched_bottle_id = ?, matched_at = ?
          WHERE id = ? AND status = 'waiting'`,
    args: [seedId, now, bottleId],
  })

  return { matchedId: seedId, isSeed: true }
}
