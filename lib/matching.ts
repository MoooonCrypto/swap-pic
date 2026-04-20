import { getDb } from './db'

export async function tryMatch(
  bottleId: string,
  userId: string
): Promise<string | null> {
  const db = getDb()
  const now = new Date().toISOString()

  const realResult = await db.execute({
    sql: `SELECT id FROM bottles
          WHERE status = 'waiting' AND user_id != ? AND is_seed = 0
          ORDER BY created_at ASC LIMIT 1`,
    args: [userId],
  })

  if (realResult.rows.length === 0) return null

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
    return candidateId
  } catch {
    return null
  }
}
