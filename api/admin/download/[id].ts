const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BUCKET = process.env.SUPABASE_BUCKET_NAME!

const headers = {
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  apikey: SERVICE_ROLE_KEY,
}

export default async function handler(req: Request): Promise<Response> {
  const id = decodeURIComponent(req.url.split('/').pop() || '')

  if (!id) {
    return new Response('Missing id', { status: 400 })
  }

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${id}`, {
    headers,
  })

  if (!res.ok) {
    const text = await res.text()
    return new Response(text || `Download failed (${res.status})`, { status: res.status })
  }

  const sep = id.indexOf('__')
  const downloadName = sep === -1 ? id : id.slice(sep + 1)
  const body = await res.arrayBuffer()

  return new Response(body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${downloadName}"`,
    },
  })
}
