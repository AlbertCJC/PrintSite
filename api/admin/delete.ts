import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = process.env.SUPABASE_BUCKET_NAME!

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'DELETE') {
    return new Response('Method not allowed', { status: 405 })
  }

  const id = req.url.split('/').pop()

  if (!id) {
    return new Response('Missing id', { status: 400 })
  }

  const { error } = await supabase.storage.from(BUCKET).remove([id])

  if (error) {
    return new Response(error.message, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
