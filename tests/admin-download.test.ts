import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import downloadHandler from '../api/admin/download/[id].ts'

vi.hoisted(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-role-key'
  process.env.SUPABASE_BUCKET_NAME = 'PrintSite'
})

const mockDownload = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn(() => ({ download: mockDownload })))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: { from: mockFrom },
  })),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/admin/download/[id]', () => {
  it('returns 400 when id is missing', async () => {
    const res = await downloadHandler(new Request('http://localhost/api/admin/download/', {
      method: 'GET',
    }))
    expect(res.status).toBe(400)
  })

  it('returns 200 with file body and attachment headers', async () => {
    mockDownload.mockResolvedValue({
      data: new Blob(['file-contents'], { type: 'image/png' }),
      error: null,
    })

    const res = await downloadHandler(new Request('http://localhost/api/admin/download/abc-123', {
      method: 'GET',
    }))
    const body = await res.arrayBuffer()

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/png')
    expect(res.headers.get('Content-Disposition')).toBe('attachment; filename="abc-123"')
    expect(new Uint8Array(body)).toEqual(new Uint8Array(
      [102, 105, 108, 101, 45, 99, 111, 110, 116, 101, 110, 116, 115]
    ))
  })

  it('returns 500 when the storage download fails', async () => {
    mockDownload.mockResolvedValue({
      data: null,
      error: new Error('not found'),
    })

    const res = await downloadHandler(new Request('http://localhost/api/admin/download/abc-123', {
      method: 'GET',
    }))

    expect(res.status).toBe(500)
  })
})
