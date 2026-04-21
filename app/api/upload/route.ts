import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/db'
import { getClientIp, hashIp, getCountryCode } from '@/lib/ipUtils'
import { checkRateLimit } from '@/lib/rateLimit'
import { tryMatch } from '@/lib/matching'
import { uploadImage, deleteImage } from '@/lib/storage'

const MAX_FILE_SIZE = 10 * 1024 * 1024
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

  const db = getDb()

  // 既にwaitingのボトルがあれば投稿不可（アップロード前にチェック）
  const existing = await db.execute({
    sql: `SELECT id FROM bottles WHERE user_id = ? AND status = 'waiting' LIMIT 1`,
    args: [userId],
  })
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: 'Already waiting.' }, { status: 409 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // EXIFを除去・リサイズ・JPEG再エンコード（無害化）
  // limitInputPixels: 展開爆弾対策（50MP ≈ 7071×7071px 相当）
  let sanitized: Buffer
  try {
    sanitized = await sharp(buffer, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer()
  } catch {
    return NextResponse.json({ error: 'Invalid image file.' }, { status: 400 })
  }

  const imageKey = `${userId}/${uuidv4()}.jpg`

  try {
    await uploadImage(imageKey, sanitized)
  } catch (e) {
    console.error('R2 upload error:', e)
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }

  const countryCode = await getCountryCode(ip)
  const bottleId = uuidv4()
  const now = new Date().toISOString()

  try {
    await db.execute({
      sql: `INSERT INTO bottles (id, user_id, ip_hash, country_code, image_path, status, delete_ok, created_at)
            VALUES (?, ?, ?, ?, ?, 'waiting', 0, ?)`,
      args: [bottleId, userId, ipHash, countryCode ?? null, imageKey, now],
    })
  } catch (e) {
    console.error('DB insert error:', e)
    await deleteImage(imageKey).catch(() => {})
    return NextResponse.json({ error: 'Database error.' }, { status: 500 })
  }

  const matchResult = await tryMatch(bottleId, userId)

  return NextResponse.json({
    bottleId,
    matched: !!matchResult,
    countryCode,
  })
}
