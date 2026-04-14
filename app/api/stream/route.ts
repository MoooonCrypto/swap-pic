import { NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { tryMatch } from '@/lib/matching'
import { getPresignedUrl } from '@/lib/storage'

export const maxDuration = 30

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
      const MAX_WAIT_MS = 10_000

      try {
        while (true) {
          const elapsed = Date.now() - startTime

          // ボトルの現在状態を確認
          const result = await db.execute({
            sql: `SELECT b.status, b.matched_bottle_id,
                         mb.image_path   AS matched_image,
                         mb.country_code AS from_country,
                         mb.is_seed      AS matched_is_seed
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
              const isSeed = Number(row.matched_is_seed) === 1
              const now = new Date().toISOString()
              if (isSeed) {
                await db.execute({
                  sql: `UPDATE bottles SET status = 'viewed' WHERE id = ?`,
                  args: [bottleId],
                })
              } else {
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
              isSeed: Number(row.matched_is_seed) === 1,
            })
            break
          }

          // 10秒経過 → シードフォールバック
          if (elapsed >= MAX_WAIT_MS) {
            await tryMatch(bottleId, userId)

            const refreshed = await db.execute({
              sql: `SELECT b.matched_bottle_id,
                           mb.image_path   AS matched_image,
                           mb.country_code AS from_country,
                           mb.is_seed      AS matched_is_seed
                    FROM bottles b
                    LEFT JOIN bottles mb ON mb.id = b.matched_bottle_id
                    WHERE b.id = ? LIMIT 1`,
              args: [bottleId],
            })

            const r = refreshed.rows[0]
            if (r?.matched_bottle_id) {
              const isSeed = Number(r.matched_is_seed) === 1
              const now = new Date().toISOString()
              if (isSeed) {
                await db.execute({
                  sql: `UPDATE bottles SET status = 'viewed' WHERE id = ?`,
                  args: [bottleId],
                })
              } else {
                await db.batch([
                  {
                    sql: `UPDATE bottles SET status = 'viewed' WHERE id = ?`,
                    args: [bottleId],
                  },
                  {
                    sql: `UPDATE bottles SET delete_ok = 1, delete_ok_at = ? WHERE id = ?`,
                    args: [now, r.matched_bottle_id as string],
                  },
                ])
              }

              let imageUrl = ''
              if (r.matched_image) {
                try {
                  imageUrl = await getPresignedUrl(r.matched_image as string, 3600)
                } catch (e) {
                  console.error('Presign error:', e)
                }
              }

              send({
                status: 'matched',
                imageUrl,
                fromCountry: r.from_country ?? '',
                isSeed: true,
              })
            } else {
              // シード画像未登録
              send({ status: 'timeout' })
            }
            break
          }

          // 待機中 heartbeat（1秒ごと）
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
