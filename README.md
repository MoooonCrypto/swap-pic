# BottleSwap / swap-pic

匿名で写真を交換するWebアプリです。ユーザーが写真を「瓶」として流すと、別のユーザーの写真とマッチングされます。画像本体はCloudflare R2に保存し、マッチング状態や履歴参照に必要なメタデータはTurso/libSQLで管理します。

## Features

- 匿名ユーザーIDによる写真アップロード・交換
- `waiting` / `matched` / `viewed` の状態管理
- Server-Sent Eventsによる待機画面の更新
- R2署名付きURLによる受信画像表示
- localStorageベースの交換履歴
- OGP画像と共有用viewページ
- IPハッシュによる簡易rate limit / ban判定

## Tech Stack

- Next.js 16 App Router
- React 19 / TypeScript
- Tailwind CSS 4
- Turso / libSQL
- Cloudflare R2
- sharp
- next-intl

## Implementation Notes

- `/api/upload` で画像を検証し、`sharp` でEXIF除去・最大1920pxへのリサイズ・JPEG再エンコードを行います。
- 画像はR2のprivate bucketに保存し、DBにはobject keyのみを保存します。
- `/api/stream` は最大30秒SSEでマッチング状態を待ち、成立時に受信画像の署名付きURLを返します。
- `turso/schema.sql` はTurso/libSQL用の初期schemaです。
- `CRON_SECRET` は `/api/admin/seed` などの管理用APIでBearer tokenとして使います。

## Setup

```bash
npm ci
cp .env.example .env.local
```

`.env.local` にTursoとCloudflare R2の値を設定します。実credentialはcommitしません。

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=swap-pic-images
CRON_SECRET=replace-with-a-random-secret
IP_SALT=replace-with-a-random-salt
```

Tursoにschemaを適用します。

```bash
turso db shell <database-name> < turso/schema.sql
```

開発サーバーを起動します。

```bash
npm run dev
```

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
npm audit
```

## Verification

Current status:

- `npm run lint` passes
- `npm run build` passes
- `npm audit` reports `0 vulnerabilities`

## Future Improvements

- Public demo URL and screenshots
- Image moderation / report flow
- Integration tests for upload, matching, and receiving
