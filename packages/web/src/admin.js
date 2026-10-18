import { listUploads, convertToPDF, deleteUpload } from './api-client.js'

export function renderAdminPage(container) {
  container.innerHTML = `
    <div class="admin-page">
      <h1>Admin — Uploads</h1>
      <button id="refresh-btn">Refresh</button>
      <table id="uploads-table" style="margin-top: 1rem; width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; border-bottom: 1px solid #ccc;">Filename</th>
            <th style="text-align: left; border-bottom: 1px solid #ccc;">Size</th>
            <th style="text-align: left; border-bottom: 1px solid #ccc;">Type</th>
            <th style="text-align: left; border-bottom: 1px solid #ccc;">Uploaded</th>
            <th style="text-align: left; border-bottom: 1px solid #ccc;">Actions</th>
          </tr>
        </thead>
        <tbody id="uploads-tbody"></tbody>
      </table>
      <div id="message" style="margin-top: 1rem;"></div>
    </div>
  `

  const tbody = container.querySelector('#uploads-tbody')
  const message = container.querySelector('#message')
  const refreshBtn = container.querySelector('#refresh-btn')

  async function loadUploads() {
    try {
      const { uploads } = await listUploads()
      tbody.innerHTML = ''

      for (const upload of uploads) {
        const row = document.createElement('tr')
        const isImage = upload.type.startsWith('image/')

        row.innerHTML = `
          <td style="border-bottom: 1px solid #eee; padding: 0.5rem;">${escapeHtml(upload.filename)}</td>
          <td style="border-bottom: 1px solid #eee; padding: 0.5rem;">${(upload.size / 1024 / 1024).toFixed(2)} MB</td>
          <td style="border-bottom: 1px solid #eee; padding: 0.5rem;">${upload.type}</td>
          <td style="border-bottom: 1px solid #eee; padding: 0.5rem;">${new Date(upload.uploadedAt).toLocaleString()}</td>
          <td style="border-bottom: 1px solid #eee; padding: 0.5rem;">
            ${isImage
              ? `<button class="convert-btn" data-id="${upload.id}">Convert to PDF</button>`
              : `<a href="/api/admin/download/${encodeURIComponent(upload.id)}" target="_blank">Download</a>`}
            <button class="print-btn" data-id="${upload.id}" ${!isImage ? 'disabled' : ''}>Print</button>
            <button class="delete-btn" data-id="${upload.id}">Delete</button>
          </td>
        `

        row.querySelector('.convert-btn')?.addEventListener('click', () => handleConvert(upload.id))
        row.querySelector('.print-btn')?.addEventListener('click', () => handlePrint(upload.id))
        row.querySelector('.delete-btn')?.addEventListener('click', () => handleDelete(upload.id))

        tbody.appendChild(row)
      }
    } catch (err) {
      message.textContent = `Failed to load uploads: ${err.message}`
    }
  }

  async function handleConvert(id) {
    try {
      message.textContent = 'Converting to PDF...'
      const result = await convertToPDF(id)
      message.textContent = `Converted to PDF: ${result.pdfUrl}`
      loadUploads()
    } catch (err) {
      message.textContent = `Convert failed: ${err.message}`
    }
  }

  async function handlePrint(id) {
    const win = window.open(`/api/admin/download/${encodeURIComponent(id)}`, '_blank')
    win?.focus()
    setTimeout(() => win?.print(), 1000)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this upload?')) return
    try {
      await deleteUpload(id)
      message.textContent = 'Deleted'
      loadUploads()
    } catch (err) {
      message.textContent = `Delete failed: ${err.message}`
    }
  }

  refreshBtn.addEventListener('click', loadUploads)
  loadUploads()
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
