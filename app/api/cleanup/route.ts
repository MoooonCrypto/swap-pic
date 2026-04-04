import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Called by cron-job.org daily
// Set up: POST https://your-domain/api/cleanup with Authorization: Bearer YOUR_CRON_SECRET
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Find expired bottles
  const { data: expired } = await supabase
    .from('bottles')
    .select('id, image_path')
    .lte('expires_at', new Date().toISOString())
    .neq('status', 'deleted')

  if (!expired || expired.length === 0) {
    return NextResponse.json({ deleted: 0 })
  }

  const imagePaths = expired.map((b) => b.image_path).filter(Boolean)
  const ids = expired.map((b) => b.id)

  // Delete from storage
  if (imagePaths.length > 0) {
    await supabase.storage.from('bottle-images').remove(imagePaths)
  }

  // Mark as deleted in DB (keep records for analytics, clear image_path)
  await supabase
    .from('bottles')
    .update({ status: 'deleted', image_path: '' })
    .in('id', ids)

  return NextResponse.json({ deleted: ids.length })
}
