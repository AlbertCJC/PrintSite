import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = process.env.SUPABASE_BUCKET_NAME!

export default async function handler(req: Request): Promise<Response> {
  const id = req.url.split('/').pop()

  if (!id) {
    return new Response('Missing id', { status: 400 })
  }

  const { data, error } = await supabase.storage.from(BUCKET).download(id)

  if (error || !data) {
    return new Response(error?.message || 'Not found', { status: 500 })
  }

  const contentType = data.type || 'application/octet-stream'
  const body = await data.arrayBuffer()

  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${id}"`,
    },
  })
}
