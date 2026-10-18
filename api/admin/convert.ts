import { PDFDocument } from 'pdf-lib'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BUCKET = process.env.SUPABASE_BUCKET_NAME!

const headers = {
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  apikey: SERVICE_ROLE_KEY,
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { id } = (await req.json()) as { id: string }

  if (!id) {
    return new Response('Missing id', { status: 400 })
  }

  // Fetch original image from Supabase Storage
  const getRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${id}`, {
    headers,
  })

  if (!getRes.ok) {
    const text = await getRes.text()
    return new Response(text || `Fetch failed (${getRes.status})`, { status: getRes.status })
  }

  const imageBytes = new Uint8Array(await getRes.arrayBuffer())

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

  const putRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${pdfId}`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/pdf',
    },
    body: pdfBytes,
  })

  if (!putRes.ok) {
    const text = await putRes.text()
    return new Response(text || `Convert failed (${putRes.status})`, { status: putRes.status })
  }

  return Response.json({
    id: pdfId,
    pdfUrl: `/api/admin/download/${encodeURIComponent(pdfId)}`,
  })
}
