import { createServiceClient } from './supabase/server'

const MAX_BOTTLES_PER_HOUR = 3

export async function checkRateLimit(ipHash: string): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createServiceClient()

  // Check if banned
  const { data: ban } = await supabase
    .from('bans')
    .select('id, expires_at')
    .eq('ip_hash', ipHash)
    .or('expires_at.is.null,expires_at.gt.now()')
    .maybeSingle()

  if (ban) {
    return { allowed: false, reason: 'banned' }
  }

  // Check rate limit: count bottles created in last hour
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('bottles')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', hourAgo)

  if ((count ?? 0) >= MAX_BOTTLES_PER_HOUR) {
    return { allowed: false, reason: 'rate_limit' }
  }

  return { allowed: true }
}
