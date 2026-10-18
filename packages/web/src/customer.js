let localFile = null

export function getLocalFile() {
  return localFile
}

export function renderCustomerPage(container) {
  container.innerHTML = `
    <div class="customer-page">
      <h1>Upload File</h1>
      <input type="file" id="file-picker" />
      <div id="file-info" style="margin: 1rem 0; display: none;"></div>
      <div id="edit-section" style="margin: 1rem 0; display: none;">
        <h2>Edit (optional)</h2>
        <div id="edit-controls"></div>
      </div>
      <button id="upload-btn" disabled>Upload to Server</button>
      <div id="message" style="margin-top: 1rem;"></div>
    </div>
  `

  const filePicker = container.querySelector('#file-picker')
  const fileInfo = container.querySelector('#file-info')
  const editSection = container.querySelector('#edit-section')
  const uploadBtn = container.querySelector('#upload-btn')
  const message = container.querySelector('#message')

  filePicker.addEventListener('change', (e) => {
    const file = e.target.files[0]
    if (!file) return

    localFile = file
    fileInfo.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
    fileInfo.style.display = 'block'
    editSection.style.display = 'block'
    uploadBtn.disabled = false
    message.textContent = 'File loaded locally. Edit if needed, then click Upload.'
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
