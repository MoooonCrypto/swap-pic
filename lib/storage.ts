import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

const BUCKET = process.env.R2_BUCKET_NAME ?? 'swap-pic-images'

/** 画像をR2にアップロード。keyを返す */
export async function uploadImage(key: string, body: Buffer, contentType = 'image/jpeg') {
  const client = getR2Client()
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
  return key
}

/** 署名付きURL（デフォルト1時間有効）を発行 */
export async function getPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const client = getR2Client()
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: expiresInSeconds }
  )
}

/** 単一オブジェクトを削除 */
export async function deleteImage(key: string) {
  const client = getR2Client()
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

/** プレフィックス以下のオブジェクトキー一覧を返す */
export async function listImages(prefix: string): Promise<string[]> {
  const client = getR2Client()
  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    )
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key)
    }
    continuationToken = res.NextContinuationToken
  } while (continuationToken)

  return keys
}

/** 複数オブジェクトをまとめて削除（最大1000件） */
export async function deleteImages(keys: string[]) {
  if (keys.length === 0) return
  const client = getR2Client()
  await client.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: keys.map((Key) => ({ Key })),
        Quiet: true,
      },
    })
  )
}
