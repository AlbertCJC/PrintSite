import { v4 as uuidv4 } from 'uuid'

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

  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return new Response('No file provided', { status: 400 })
  }

  const id = uuidv4()
  const path = `${id}__${file.name}`
  const arrayBuffer = await file.arrayBuffer()

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': file.type,
    },
    body: arrayBuffer,
  })

  if (!res.ok) {
    const text = await res.text()
    return new Response(text || `Upload failed (${res.status})`, { status: res.status })
  }

  return Response.json({
    id: path,
    filename: file.name,
    size: file.size,
    type: file.type,
  })
}
