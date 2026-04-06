import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { tryMatch } from '@/lib/matching'
import { getPresignedUrl } from '@/lib/storage'

export async function GET(req: NextRequest) {
  const bottleId = req.nextUrl.searchParams.get('bottleId')
  const userId = req.nextUrl.searchParams.get('userId')

  if (!bottleId || !userId) {
    return NextResponse.json({ error: 'Missing params.' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: bottle } = await supabase
    .from('bottles')
    .select('id, user_id, status, matched_bottle_id, country_code')
    .eq('id', bottleId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!bottle) {
    return NextResponse.json({ error: 'Bottle not found.' }, { status: 404 })
  }

  // まだ待機中 → マッチング再試行してから返す
  if (bottle.status === 'waiting') {
    await tryMatch(bottle.id, userId)
    const { data: refreshed } = await supabase
      .from('bottles')
      .select('status')
      .eq('id', bottleId)
      .single()

    if (refreshed?.status === 'waiting') {
      return NextResponse.json({ status: 'waiting' })
    }
    return NextResponse.json({ status: 'matched' })
  }

  // マッチング済み or 閲覧済み → 相手の画像の署名付きURLを返す
  if (
    (bottle.status === 'matched' || bottle.status === 'viewed') &&
    bottle.matched_bottle_id
  ) {
    const { data: matched } = await supabase
      .from('bottles')
      .select('image_path, country_code, delete_ok')
      .eq('id', bottle.matched_bottle_id)
      .single()

    if (!matched || !matched.image_path) {
      return NextResponse.json({ status: bottle.status, imageUrl: null })
    }

    // 署名付きURL発行（1時間有効）
    let imageUrl: string | null = null
    try {
      imageUrl = await getPresignedUrl(matched.image_path, 3600)
    } catch (e) {
      console.error('Presign error:', e)
    }

    // 初回閲覧時:
    //   - 自分のボトルを viewed に更新
    //   - 相手の画像に delete_ok フラグを立てる（受信者が開封 = 送信画像は削除OK）
    if (bottle.status === 'matched') {
      const now = new Date().toISOString()

      await Promise.all([
        supabase
          .from('bottles')
          .update({ status: 'viewed' })
          .eq('id', bottle.id),

        supabase
          .from('bottles')
          .update({ delete_ok: true, delete_ok_at: now })
          .eq('id', bottle.matched_bottle_id),
      ])
    }

    return NextResponse.json({
      status: 'matched',
      imageUrl,
      fromCountry: matched.country_code ?? null,
    })
  }

  return NextResponse.json({ status: bottle.status })
}
