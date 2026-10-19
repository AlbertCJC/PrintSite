import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = process.env.SUPABASE_BUCKET_NAME!

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { data, error } = await supabase.storage.from(BUCKET).list()

  if (error) {
    return new Response(error.message, { status: 500 })
  }

  const uploads = (data || []).map((obj) => ({
    id: obj.name,
    filename: obj.name,
    size: obj.size || 0,
    type: obj.metadata?.mimetype || 'application/octet-stream',
    uploadedAt: obj.created_at || new Date().toISOString(),
    url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${obj.name}`,
  }))

  return Response.json({ uploads })
}
