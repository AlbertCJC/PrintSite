const API_BASE = ''

/**
 * Upload a file to the server.
 * @param {File} file
 * @returns {Promise<UploadResponse>}
 */
export async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Upload failed (${res.status})`)
  }

  return await res.json()
}

/**
 * List all uploads from the server.
 * @returns {Promise<{ uploads: Upload[] }>}
 */
export async function listUploads() {
  const res = await fetch(`${API_BASE}/api/admin/list`)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `List failed (${res.status})`)
  }

  return await res.json()
}

/**
 * Convert an uploaded image to PDF.
 * @param {string} id - Upload ID
 * @returns {Promise<{ id: string, pdfUrl: string }>}
 */
export async function convertToPDF(id) {
  const res = await fetch(`${API_BASE}/api/admin/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Convert failed (${res.status})`)
  }

  return await res.json()
}

/**
 * Delete an upload from the server.
 * @param {string} id - Upload ID
 * @returns {Promise<void>}
 */
export async function deleteUpload(id) {
  const res = await fetch(`${API_BASE}/api/admin/delete/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Delete failed (${res.status})`)
  }
}
