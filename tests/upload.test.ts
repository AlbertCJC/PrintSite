import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import uploadHandler from '../api/upload.ts'

vi.hoisted(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-role-key'
  process.env.SUPABASE_BUCKET_NAME = 'PrintSite'
})

const mockUpload = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn(() => ({ upload: mockUpload })))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: { from: mockFrom },
  })),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

async function postFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return uploadHandler(new Request('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
  }))
}

describe('POST /api/upload', () => {
  it('returns 405 for non-POST methods', async () => {
    const res = await uploadHandler(new Request('http://localhost/api/upload', {
      method: 'GET',
    }))
    expect(res.status).toBe(405)
  })

  it('returns 400 when no file is provided', async () => {
    const res = await uploadHandler(new Request('http://localhost/api/upload', {
      method: 'POST',
      body: new FormData(),
    }))
    expect(res.status).toBe(400)
  })

  it('uploads the file and returns 200 with metadata', async () => {
    const file = new File(['hello'], 'test.png', { type: 'image/png' })
    mockUpload.mockResolvedValue({ error: null })

    const res = await postFile(file)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toMatchObject({
      id: expect.any(String),
      filename: 'test.png',
      size: 5,
      type: 'image/png',
    })
    expect(mockFrom).toHaveBeenCalledWith('PrintSite')
    expect(mockUpload).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(ArrayBuffer),
      { contentType: 'image/png' }
    )
  })

  it('returns 500 when the storage upload fails', async () => {
    const file = new File(['hello'], 'test.png', { type: 'image/png' })
    mockUpload.mockResolvedValue({ error: new Error('upload failed') })

    const res = await postFile(file)

    expect(res.status).toBe(500)
  })
})
