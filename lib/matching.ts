import { getDb } from './db'

export async function tryMatch(bottleId: string, userId: string): Promise<string | null> {
  const db = getDb()
  const now = new Date().toISOString()

  // 自分以外の最古のwaiting ボトルを探す
  const result = await db.execute({
    sql: `SELECT id FROM bottles
          WHERE status = 'waiting' AND user_id != ?
          ORDER BY created_at ASC
          LIMIT 1`,
    args: [userId],
  })

  if (result.rows.length === 0) return null

  const candidateId = result.rows[0].id as string

  // 両ボトルをまとめて matched に更新（batch で原子的に実行）
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
  } catch {
    return null
  }

  return candidateId
}
