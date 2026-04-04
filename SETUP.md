# ながれびん / Drift Pic — Setup Guide

## 1. Supabase Setup

### Create project
1. Go to [supabase.com](https://supabase.com) → New project
2. Run `supabase/schema.sql` in the SQL editor

### Create storage bucket
In the Supabase dashboard → Storage → New bucket:
- Name: `bottle-images`
- Public: **OFF** (private — images served via signed URLs)

### Add storage policy
In Storage → Policies → `bottle-images` bucket, add:
```sql
-- Allow service role full access (API routes use service key)
CREATE POLICY "service_role_all" ON storage.objects
  FOR ALL TO service_role USING (true);
```

## 2. Environment Variables

Copy `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CRON_SECRET=<random string, e.g. openssl rand -hex 32>
```

## 3. Vercel Deployment

```bash
vercel --prod
```

Add the same env vars in Vercel dashboard → Settings → Environment Variables.

## 4. Auto-deletion Cron (cron-job.org)

1. Sign up at [cron-job.org](https://cron-job.org)
2. Create a new cron job:
   - URL: `https://your-domain.vercel.app/api/cleanup`
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`
   - Schedule: Daily (e.g., 03:00 UTC)

## 5. Architecture Overview

```
User (browser)
  ├─ getOrCreateUserId() → localStorage UUID
  ├─ POST /api/upload    → sanitize image (sharp) → Supabase Storage
  │                      → insert bottle record → tryMatch()
  ├─ GET  /api/status    → poll every 5s → check match → signed URL
  └─ /receive            → show image with bottle-open animation

Daily cron → POST /api/cleanup → delete expired images from storage
```

## 6. Data Flow

1. User uploads photo → stored in `bottle-images/{userId}/{uuid}.jpg`
2. Bottle record created: `status: waiting`
3. If another waiting bottle exists (different user) → both matched
4. Matched user polls `/api/status` → gets signed image URL (1h)
5. After 24h → cron job deletes storage files + marks `status: deleted`

## 7. Moderation Notes

- Images are re-encoded with `sharp` (strips EXIF, resizes to max 1920px)
- Rate limit: 3 bottles/hour per IP
- Ban table: add rows to `bans` to block IPs manually
- Consider integrating a content moderation API (e.g. AWS Rekognition) for production
