import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = process.env.SUPABASE_BUCKET_NAME!

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return new Response('No file provided', { status: 400 })
  }

  const id = crypto.randomUUID()
  const arrayBuffer = await file.arrayBuffer()

  const { error } = await supabase.storage.from(BUCKET).upload(id, arrayBuffer, {
    contentType: file.type,
  })

  if (error) {
    return new Response(error.message, { status: 500 })
  }

  return Response.json({
    id,
    filename: file.name,
    size: file.size,
    type: file.type,
  })
}
