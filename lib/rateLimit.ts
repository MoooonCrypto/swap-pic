import { getDb } from './db'

const MAX_BOTTLES_PER_HOUR = 3

export async function checkRateLimit(ipHash: string): Promise<{ allowed: boolean; reason?: string }> {
  const db = getDb()

  // BANチェック
  const banResult = await db.execute({
    sql: `SELECT id FROM bans
          WHERE ip_hash = ?
          AND (expires_at IS NULL OR expires_at > ?)
          LIMIT 1`,
    args: [ipHash, new Date().toISOString()],
  })

  if (banResult.rows.length > 0) {
    return { allowed: false, reason: 'banned' }
  }

  // レートリミット：1時間以内に作成したボトル数
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as cnt FROM bottles WHERE ip_hash = ? AND created_at >= ?`,
    args: [ipHash, hourAgo],
  })

  const count = Number(countResult.rows[0]?.cnt ?? 0)
  if (count >= MAX_BOTTLES_PER_HOUR) {
    return { allowed: false, reason: 'rate_limit' }
  }

  return { allowed: true }
}
