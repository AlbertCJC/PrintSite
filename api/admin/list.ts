const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BUCKET = process.env.SUPABASE_BUCKET_NAME!

const headers = {
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  apikey: SERVICE_ROLE_KEY,
  'Content-Type': 'application/json',
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } }),
  })

  if (!res.ok) {
    const text = await res.text()
    return new Response(text || `List failed (${res.status})`, { status: res.status })
  }

  const data = await res.json()
  const objects = data.data || []

  const uploads = objects.map((obj: any) => {
    const path = obj.name
    const sep = path.indexOf('__')
    const filename = sep === -1 ? path : path.slice(sep + 1)
    return {
      id: path,
      filename,
      size: obj.metadata?.size || 0,
      type: obj.metadata?.mimetype || 'application/octet-stream',
      uploadedAt: obj.created_at || new Date().toISOString(),
      url: `/api/admin/download/${encodeURIComponent(path)}`,
    }
  })

  return Response.json({ uploads })
}
