import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

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
  const id = req.url.split('/').pop()

  if (!id) {
    return new Response('Missing id', { status: 400 })
  }

  const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: id }))
  const stream = res.Body as any
  const chunks: Uint8Array[] = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  const body = Buffer.concat(chunks.map((c: any) => Buffer.from(c)))

  return new Response(body, {
    headers: {
      'Content-Type': res.ContentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${id}"`,
    },
  })
}
