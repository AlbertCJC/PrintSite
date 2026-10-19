import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument } from 'pdf-lib'
import convertHandler from '../api/admin/convert.ts'

vi.hoisted(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-role-key'
  process.env.SUPABASE_BUCKET_NAME = 'PrintSite'
})

const mockDownload = vi.hoisted(() => vi.fn())
const mockUpload = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn(() => ({
  download: mockDownload,
  upload: mockUpload,
})))

const mockDrawImage = vi.hoisted(() => vi.fn())
const mockAddPage = vi.hoisted(() => vi.fn().mockReturnValue({ drawImage: mockDrawImage }))
const mockEmbedPng = vi.hoisted(() => vi.fn().mockResolvedValue({
  size: vi.fn().mockReturnValue({ width: 100, height: 100 }),
}))
const mockSave = vi.hoisted(() => vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])))
const mockCreate = vi.hoisted(() => vi.fn().mockResolvedValue({
  addPage: mockAddPage,
  embedPng: mockEmbedPng,
  save: mockSave,
  drawImage: mockDrawImage,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: { from: mockFrom },
  })),
}))

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: mockCreate,
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

async function postJson(body: unknown) {
  return convertHandler(new Request('http://localhost/api/admin/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }))
}

describe('POST /api/admin/convert', () => {
  it('returns 405 for non-POST methods', async () => {
    const res = await convertHandler(new Request('http://localhost/api/admin/convert', {
      method: 'GET',
    }))
    expect(res.status).toBe(405)
  })

  it('returns 400 when id is missing', async () => {
    const res = await postJson({})
    expect(res.status).toBe(400)
  })

  it('returns 200 with pdf id and url on success', async () => {
    mockDownload.mockResolvedValue({
      data: new Blob(['fake-image-bytes']),
      error: null,
    })
    mockUpload.mockResolvedValue({ error: null })

    const res = await postJson({ id: 'img-789' })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toMatchObject({
      id: 'img-789.pdf',
      pdfUrl: 'https://example.supabase.co/storage/v1/object/public/PrintSite/img-789.pdf',
    })
    expect(mockDownload).toHaveBeenCalledWith('img-789')
    expect(mockCreate).toHaveBeenCalled()
    expect(mockSave).toHaveBeenCalled()
    expect(mockUpload).toHaveBeenCalledWith(
      'img-789.pdf',
      expect.any(Uint8Array),
      { contentType: 'application/pdf' }
    )
  })

  it('returns 500 when downloading the image fails', async () => {
    mockDownload.mockResolvedValue({
      data: null,
      error: new Error('not found'),
    })

    const res = await postJson({ id: 'img-789' })

    expect(res.status).toBe(500)
  })
})
