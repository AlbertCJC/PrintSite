const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BUCKET = process.env.SUPABASE_BUCKET_NAME!

const headers = {
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  apikey: SERVICE_ROLE_KEY,
  'Content-Type': 'application/json',
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'DELETE') {
    return new Response('Method not allowed', { status: 405 })
  }

  const id = decodeURIComponent(req.url.split('/').pop() || '')

  if (!id) {
    return new Response('Missing id', { status: 400 })
  }

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify([id]),
  })

  if (!res.ok) {
    const text = await res.text()
    return new Response(text || `Delete failed (${res.status})`, { status: res.status })
  }

  return new Response(null, { status: 204 })
}
