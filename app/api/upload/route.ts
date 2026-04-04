import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { createServiceClient } from '@/lib/supabase/server'
import { getClientIp, hashIp, getCountryCode } from '@/lib/ipUtils'
import { checkRateLimit } from '@/lib/rateLimit'
import { tryMatch } from '@/lib/matching'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const BUCKET = 'bottle-images'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const ipHash = hashIp(ip)

  // Rate limit check
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

  // Validate userId format (UUID)
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: 'Invalid userId.' }, { status: 400 })
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 })
  }

  // Validate MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Sanitize image with sharp: strip EXIF, re-encode as JPEG
  let sanitized: Buffer
  try {
    sanitized = await sharp(buffer)
      .rotate() // auto-rotate based on EXIF (then strips EXIF)
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer()
  } catch {
    return NextResponse.json({ error: 'Invalid image file.' }, { status: 400 })
  }

  const imagePath = `${userId}/${uuidv4()}.jpg`
  const supabase = createServiceClient()

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(imagePath, sanitized, { contentType: 'image/jpeg', upsert: false })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }

  // Get country code (non-blocking)
  const countryCode = await getCountryCode(ip)

  // Create bottle record
  const { data: bottle, error: dbError } = await supabase
    .from('bottles')
    .insert({
      user_id: userId,
      ip_hash: ipHash,
      country_code: countryCode,
      image_path: imagePath,
      status: 'waiting',
    })
    .select('id')
    .single()

  if (dbError || !bottle) {
    // Cleanup uploaded image
    await supabase.storage.from(BUCKET).remove([imagePath])
    return NextResponse.json({ error: 'Database error.' }, { status: 500 })
  }

  // Attempt immediate matching
  const matchedBottleId = await tryMatch(bottle.id, userId)

  return NextResponse.json({
    bottleId: bottle.id,
    matched: !!matchedBottleId,
    countryCode,
  })
}
