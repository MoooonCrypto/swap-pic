import { getDb } from './db'

export async function checkRateLimit(ipHash: string): Promise<{ allowed: boolean; reason?: string }> {
  const db = getDb()

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

  return { allowed: true }
}
