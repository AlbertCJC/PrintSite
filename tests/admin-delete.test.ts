import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import deleteHandler from '../api/admin/delete.ts'

vi.hoisted(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-role-key'
  process.env.SUPABASE_BUCKET_NAME = 'PrintSite'
})

const mockRemove = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn(() => ({ remove: mockRemove })))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: { from: mockFrom },
  })),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DELETE /api/admin/delete/[id]', () => {
  it('returns 405 for non-DELETE methods', async () => {
    const res = await deleteHandler(new Request('http://localhost/api/admin/delete/abc-123', {
      method: 'GET',
    }))
    expect(res.status).toBe(405)
  })

  it('returns 400 when id is missing', async () => {
    const res = await deleteHandler(new Request('http://localhost/api/admin/delete/', {
      method: 'DELETE',
    }))
    expect(res.status).toBe(400)
  })

  it('returns 204 on successful deletion', async () => {
    mockRemove.mockResolvedValue({ error: null })

    const res = await deleteHandler(new Request('http://localhost/api/admin/delete/abc-123', {
      method: 'DELETE',
    }))

    expect(res.status).toBe(204)
    expect(mockRemove).toHaveBeenCalledWith(['abc-123'])
  })

  it('returns 500 when the storage remove fails', async () => {
    mockRemove.mockResolvedValue({ error: new Error('remove failed') })

    const res = await deleteHandler(new Request('http://localhost/api/admin/delete/abc-123', {
      method: 'DELETE',
    }))

    expect(res.status).toBe(500)
  })
})
