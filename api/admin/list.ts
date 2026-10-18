import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

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
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const res = await r2.send(new ListObjectsV2Command({ Bucket: BUCKET }))
  const objects = res.Contents || []

  const uploads = objects.map((obj) => ({
    id: obj.Key!,
    filename: obj.Key!,
    size: obj.Size || 0,
    type: 'application/octet-stream',
    uploadedAt: obj.LastModified?.toISOString() || new Date().toISOString(),
    url: `${process.env.R2_ENDPOINT}/${BUCKET}/${obj.Key}`,
  }))

  return Response.json({ uploads })
}
