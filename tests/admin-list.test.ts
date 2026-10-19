import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import listHandler from '../api/admin/list.ts'

vi.hoisted(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-role-key'
  process.env.SUPABASE_BUCKET_NAME = 'PrintSite'
})

const mockList = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn(() => ({ list: mockList })))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: { from: mockFrom },
  })),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/admin/list', () => {
  it('returns 405 for non-GET methods', async () => {
    const res = await listHandler(new Request('http://localhost/api/admin/list', {
      method: 'POST',
    }))
    expect(res.status).toBe(405)
  })

  it('returns 200 with the list of uploads', async () => {
    mockList.mockResolvedValue({
      data: [
        {
          name: 'abc-123',
          size: 1024,
          metadata: { mimetype: 'image/png' },
          created_at: '2026-10-18T00:00:00Z',
        },
        {
          name: 'def-456.txt',
          size: 2048,
          metadata: {},
          created_at: '2026-10-18T01:00:00Z',
        },
      ],
      error: null,
    })

    const res = await listHandler(new Request('http://localhost/api/admin/list', {
      method: 'GET',
    }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.uploads).toHaveLength(2)
    expect(body.uploads[0]).toMatchObject({
      id: 'abc-123',
      filename: 'abc-123',
      size: 1024,
      type: 'image/png',
      uploadedAt: '2026-10-18T00:00:00Z',
      url: 'https://example.supabase.co/storage/v1/object/public/PrintSite/abc-123',
    })
    expect(body.uploads[1].type).toBe('application/octet-stream')
  })

  it('returns 500 when the storage list fails', async () => {
    mockList.mockResolvedValue({ data: null, error: new Error('list failed') })

    const res = await listHandler(new Request('http://localhost/api/admin/list', {
      method: 'GET',
    }))

    expect(res.status).toBe(500)
  })
})
