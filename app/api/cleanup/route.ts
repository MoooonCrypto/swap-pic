import { NextRequest, NextResponse } from 'next/server'

// 画像は永続保存のため削除処理は無効化
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ deleted: 0 })
}
