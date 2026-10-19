import { createClient } from '@supabase/supabase-js'
import { PDFDocument } from 'pdf-lib'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = process.env.SUPABASE_BUCKET_NAME!

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { id } = await req.json() as { id: string }

  if (!id) {
    return new Response('Missing id', { status: 400 })
  }

  // Fetch original image from Supabase Storage
  const { data, error } = await supabase.storage.from(BUCKET).download(id)

  if (error || !data) {
    return new Response(error?.message || 'Not found', { status: 500 })
  }

  const imageBytes = new Uint8Array(await data.arrayBuffer())

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

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(
    pdfId,
    pdfBytes,
    {
      contentType: 'application/pdf',
    }
  )

  if (uploadError) {
    return new Response(uploadError.message, { status: 500 })
  }

  return Response.json({
    id: pdfId,
    pdfUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${pdfId}`,
  })
}
