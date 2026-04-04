import { createServiceClient } from './supabase/server'

// Attempt to match the given bottle with a waiting bottle from another user.
// Returns matched bottle id if successful, null if no match yet.
export async function tryMatch(bottleId: string, userId: string): Promise<string | null> {
  const supabase = createServiceClient()

  // Find oldest waiting bottle from a different user
  const { data: candidate } = await supabase
    .from('bottles')
    .select('id')
    .eq('status', 'waiting')
    .neq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!candidate) return null

  const now = new Date().toISOString()

  // Update both bottles atomically (best-effort with two updates)
  const { error: e1 } = await supabase
    .from('bottles')
    .update({ status: 'matched', matched_bottle_id: candidate.id, matched_at: now })
    .eq('id', bottleId)
    .eq('status', 'waiting')

  if (e1) return null

  const { error: e2 } = await supabase
    .from('bottles')
    .update({ status: 'matched', matched_bottle_id: bottleId, matched_at: now })
    .eq('id', candidate.id)
    .eq('status', 'waiting')

  if (e2) {
    // Rollback our update
    await supabase
      .from('bottles')
      .update({ status: 'waiting', matched_bottle_id: null, matched_at: null })
      .eq('id', bottleId)
    return null
  }

  return candidate.id
}
