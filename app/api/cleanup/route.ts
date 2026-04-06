import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { deleteImages } from '@/lib/storage'

// cron-job.org から毎日 POST で叩くエンドポイント
// Authorization: Bearer {CRON_SECRET}
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // delete_ok = true かつ未削除のボトルを取得
  const { data: targets, error } = await supabase
    .from('bottles')
    .select('id, image_path')
    .eq('delete_ok', true)
    .neq('status', 'deleted')

  if (error) {
    console.error('Cleanup query error:', error)
    return NextResponse.json({ error: 'DB error.' }, { status: 500 })
  }

  if (!targets || targets.length === 0) {
    return NextResponse.json({ deleted: 0 })
  }

  const keys = targets.map((b) => b.image_path).filter(Boolean)
  const ids = targets.map((b) => b.id)

  // R2から一括削除
  try {
    await deleteImages(keys)
  } catch (e) {
    console.error('R2 delete error:', e)
    // R2削除失敗でもDB更新は試みる（次回cron で再試行される）
  }

  // DBのステータスを deleted に更新、image_path をクリア
  await supabase
    .from('bottles')
    .update({ status: 'deleted', image_path: '' })
    .in('id', ids)

  return NextResponse.json({ deleted: ids.length })
}
