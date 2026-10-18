import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

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
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return new Response('No file provided', { status: 400 })
  }

  const id = uuidv4()
  const arrayBuffer = await file.arrayBuffer()

  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: id,
    Body: arrayBuffer,
    ContentType: file.type,
  }))

  return Response.json({
    id,
    filename: file.name,
    size: file.size,
    type: file.type,
  })
}
