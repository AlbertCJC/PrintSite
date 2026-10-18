import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const r2 = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME!

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'DELETE') {
    return new Response('Method not allowed', { status: 405 })
  }

  const id = req.url.split('/').pop()

  if (!id) {
    return new Response('Missing id', { status: 400 })
  }

  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: id }))

  return new Response(null, { status: 204 })
}
