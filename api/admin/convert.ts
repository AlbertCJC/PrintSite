import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { PDFDocument } from 'pdf-lib'

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

  const { id } = await req.json() as { id: string }

  if (!id) {
    return new Response('Missing id', { status: 400 })
  }

  // Fetch original image from R2
  const getRes = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: id }))
  const stream = getRes.Body as any
  const chunks: Uint8Array[] = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  const imageBytes = Buffer.concat(chunks.map((c: any) => Buffer.from(c)))

  // Convert image to PDF using pdf-lib
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 800])
  const image = await pdfDoc.embedPng(imageBytes)
  const { width, height } = image.size()
  const fitWidth = 500
  const fitHeight = (height / width) * fitWidth
  page.drawImage(image, {
    x: (600 - fitWidth) / 2,
    y: (800 - fitHeight) / 2,
    width: fitWidth,
    height: fitHeight,
  })

  const pdfBytes = await pdfDoc.save()
  const pdfId = `${id}.pdf`

  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: pdfId,
    Body: pdfBytes,
    ContentType: 'application/pdf',
  }))

  return Response.json({
    id: pdfId,
    pdfUrl: `${process.env.R2_ENDPOINT}/${BUCKET}/${pdfId}`,
  })
}
