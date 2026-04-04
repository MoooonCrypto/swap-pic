import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { tryMatch } from '@/lib/matching'

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
    .eq('user_id', userId) // ensure ownership
    .maybeSingle()

  if (!bottle) {
    return NextResponse.json({ error: 'Bottle not found.' }, { status: 404 })
  }

  if (bottle.status === 'waiting') {
    // Try to match again in case a new bottle arrived
    await tryMatch(bottle.id, userId)

    // Re-fetch
    const { data: refreshed } = await supabase
      .from('bottles')
      .select('status, matched_bottle_id')
      .eq('id', bottleId)
      .single()

    if (refreshed?.status === 'waiting') {
      return NextResponse.json({ status: 'waiting' })
    }

    return NextResponse.json({ status: 'matched' })
  }

  if (bottle.status === 'matched' && bottle.matched_bottle_id) {
    // Fetch the matched bottle's image signed URL
    const { data: matched } = await supabase
      .from('bottles')
      .select('image_path, country_code')
      .eq('id', bottle.matched_bottle_id)
      .single()

    if (!matched) {
      return NextResponse.json({ status: 'matched', imageUrl: null })
    }

    const { data: signedUrl } = await supabase.storage
      .from('bottle-images')
      .createSignedUrl(matched.image_path, 60 * 60) // 1 hour

    // Mark as viewed
    await supabase
      .from('bottles')
      .update({ status: 'viewed' })
      .eq('id', bottleId)

    return NextResponse.json({
      status: 'matched',
      imageUrl: signedUrl?.signedUrl ?? null,
      fromCountry: matched.country_code,
    })
  }

  if (bottle.status === 'viewed' && bottle.matched_bottle_id) {
    // Already viewed — re-generate signed URL
    const { data: matched } = await supabase
      .from('bottles')
      .select('image_path, country_code')
      .eq('id', bottle.matched_bottle_id)
      .single()

    if (matched) {
      const { data: signedUrl } = await supabase.storage
        .from('bottle-images')
        .createSignedUrl(matched.image_path, 60 * 60)

      return NextResponse.json({
        status: 'viewed',
        imageUrl: signedUrl?.signedUrl ?? null,
        fromCountry: matched.country_code,
      })
    }
  }

  return NextResponse.json({ status: bottle.status })
}
