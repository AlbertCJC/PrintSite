import { mergeImagesSideBySide, removePdfPages } from './editing.js'

let localFile = null
let selectedFiles = []

export function getLocalFile() {
  return localFile
}

export function renderCustomerPage(container) {
  container.innerHTML = `
    <div class="customer-page">
      <h1>Upload File</h1>
      <input type="file" id="file-picker" multiple />
      <div id="file-info" class="file-info" style="display: none;"></div>
      <div id="edit-section" style="display: none;">
        <h2>Edit (optional)</h2>
        <div id="edit-controls"></div>
      </div>
      <button id="upload-btn" class="btn btn-primary" disabled>Upload to Server</button>
      <div id="message" class="message"></div>
    </div>
  `

  const filePicker = container.querySelector('#file-picker')
  const fileInfo = container.querySelector('#file-info')
  const editSection = container.querySelector('#edit-section')
  const editControls = container.querySelector('#edit-controls')
  const uploadBtn = container.querySelector('#upload-btn')
  const message = container.querySelector('#message')

  function renderEditControls() {
    editControls.innerHTML = ''
    const imageFiles = selectedFiles.filter(f => f.type.startsWith('image/'))
    const pdfFiles = selectedFiles.filter(f => f.type === 'application/pdf')

    if (imageFiles.length >= 2) {
      const btn = document.createElement('button')
      btn.textContent = 'Merge 2 images'
      btn.style.marginRight = '0.5rem'
      btn.addEventListener('click', async () => {
        uploadBtn.disabled = true
        message.textContent = 'Merging images...'
        try {
          localFile = await mergeImagesSideBySide(imageFiles)
          message.textContent = 'Images merged. Ready to upload.'
          uploadBtn.disabled = false
        } catch (err) {
          message.textContent = `Merge failed: ${err.message}`
          uploadBtn.disabled = false
        }
      })
      editControls.appendChild(btn)
    }

    if (pdfFiles.length === 1) {
      const input = document.createElement('input')
      input.type = 'number'
      input.placeholder = 'Page # to remove'
      input.min = '1'
      input.style.marginRight = '0.5rem'
      editControls.appendChild(input)

      const btn = document.createElement('button')
      btn.textContent = 'Remove page'
      btn.addEventListener('click', async () => {
        const pageNum = parseInt(input.value, 10)
        if (!pageNum || pageNum < 1) {
          message.textContent = 'Invalid page number'
          return
        }
        uploadBtn.disabled = true
        message.textContent = 'Removing page...'
        try {
          localFile = await removePdfPages(pdfFiles[0], [pageNum - 1])
          message.textContent = 'PDF page removed. Ready to upload.'
          uploadBtn.disabled = false
        } catch (err) {
          message.textContent = `Remove failed: ${err.message}`
          uploadBtn.disabled = false
        }
      })
      editControls.appendChild(btn)
    }
  }

  filePicker.addEventListener('change', (e) => {
    selectedFiles = Array.from(e.target.files)
    if (!selectedFiles.length) return

    localFile = selectedFiles[0]
    const names = selectedFiles.map(f => f.name).join(', ')
    const totalMB = (selectedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)
    fileInfo.textContent = `Selected: ${names} (${totalMB} MB)`
    fileInfo.style.display = 'block'
    editSection.style.display = 'block'
    uploadBtn.disabled = false
    message.textContent = 'File(s) loaded locally. Edit if needed, then click Upload.'
    renderEditControls()
  })

  uploadBtn.addEventListener('click', async () => {
    if (!localFile) return
    uploadBtn.disabled = true
    message.textContent = 'Uploading...'
    try {
      const { default: apiClient } = await import('./api-client.js')
      const result = await apiClient.uploadFile(localFile)
      message.textContent = `Uploaded: ${result.filename} (${result.id})`
      localFile = null
      selectedFiles = []
      filePicker.value = ''
      fileInfo.style.display = 'none'
      editSection.style.display = 'none'
      uploadBtn.disabled = true
    } catch (err) {
      message.textContent = `Upload failed: ${err.message}`
      uploadBtn.disabled = false
    }
  })
}
