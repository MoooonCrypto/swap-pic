import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { createServiceClient } from '@/lib/supabase/server'
import { getClientIp, hashIp, getCountryCode } from '@/lib/ipUtils'
import { checkRateLimit } from '@/lib/rateLimit'
import { tryMatch } from '@/lib/matching'
import { uploadImage, deleteImage } from '@/lib/storage'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const ipHash = hashIp(ip)

  const limit = await checkRateLimit(ipHash)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: limit.reason === 'banned' ? 'You are banned.' : 'Too many requests. Please wait.' },
      { status: 429 }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
  }

  const file = formData.get('image') as File | null
  const userId = formData.get('userId') as string | null

  if (!file || !userId) {
    return NextResponse.json({ error: 'Missing image or userId.' }, { status: 400 })
  }

  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: 'Invalid userId.' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // EXIFを除去し、最大1920pxにリサイズ、JPEGに再エンコード（無害化）
  let sanitized: Buffer
  try {
    sanitized = await sharp(buffer)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer()
  } catch {
    return NextResponse.json({ error: 'Invalid image file.' }, { status: 400 })
  }

  const imageKey = `${userId}/${uuidv4()}.jpg`

  // R2にアップロード
  try {
    await uploadImage(imageKey, sanitized)
  } catch (e) {
    console.error('R2 upload error:', e)
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }

  const countryCode = await getCountryCode(ip)
  const supabase = createServiceClient()

  // DBにボトルレコード作成
  const { data: bottle, error: dbError } = await supabase
    .from('bottles')
    .insert({
      user_id: userId,
      ip_hash: ipHash,
      country_code: countryCode,
      image_path: imageKey,
      status: 'waiting',
      delete_ok: false,
    })
    .select('id')
    .single()

  if (dbError || !bottle) {
    await deleteImage(imageKey).catch(() => {})
    return NextResponse.json({ error: 'Database error.' }, { status: 500 })
  }

  // マッチング試行
  const matchedBottleId = await tryMatch(bottle.id, userId)

  return NextResponse.json({
    bottleId: bottle.id,
    matched: !!matchedBottleId,
    countryCode,
  })
}
