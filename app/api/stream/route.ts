import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getPresignedUrl } from '@/lib/storage'

export const maxDuration = 70

export async function GET(req: NextRequest) {
  const bottleId = req.nextUrl.searchParams.get('bottleId')
  const userId = req.nextUrl.searchParams.get('userId')

  if (!bottleId || !userId) {
    return new Response('Missing params', { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const db = getDb()
      const startTime = Date.now()
      const MAX_WAIT_MS = 60_000

      try {
        while (true) {
          const elapsed = Date.now() - startTime

          const result = await db.execute({
            sql: `SELECT b.status, b.matched_bottle_id,
                         mb.image_path   AS matched_image,
                         mb.country_code AS from_country
                  FROM bottles b
                  LEFT JOIN bottles mb ON mb.id = b.matched_bottle_id
                  WHERE b.id = ? AND b.user_id = ? LIMIT 1`,
            args: [bottleId, userId],
          })

          const row = result.rows[0]
          if (!row) {
            send({ status: 'error' })
            break
          }

          const status = row.status as string

          // マッチング済み → 初回処理 + イベント送信
          if ((status === 'matched' || status === 'viewed') && row.matched_bottle_id) {
            if (status === 'matched') {
              const now = new Date().toISOString()
              await db.batch([
                {
                  sql: `UPDATE bottles SET status = 'viewed' WHERE id = ?`,
                  args: [bottleId],
                },
                {
                  sql: `UPDATE bottles SET delete_ok = 1, delete_ok_at = ? WHERE id = ?`,
                  args: [now, row.matched_bottle_id as string],
                },
              ])
            }

            let imageUrl = ''
            if (row.matched_image) {
              try {
                imageUrl = await getPresignedUrl(row.matched_image as string, 3600)
              } catch (e) {
                console.error('Presign error:', e)
              }
            }

            send({
              status: 'matched',
              imageUrl,
              fromCountry: row.from_country ?? '',
            })
            break
          }

          // 60秒経過 → シードなし、localStorageに委ねる
          if (elapsed >= MAX_WAIT_MS) {
            send({ status: 'no_match' })
            break
          }

          send({ status: 'waiting', elapsed: Math.floor(elapsed / 1000) })
          await new Promise((r) => setTimeout(r, 1000))
        }
      } catch (e) {
        console.error('SSE stream error:', e)
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ status: 'error' })}\n\n`)
          )
        } catch {}
      } finally {
        try {
          controller.close()
        } catch {}
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
