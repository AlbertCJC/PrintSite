/**
 * Merge two images side-by-side onto one canvas page.
 * @param {File[]} files - Array of image files
 * @returns {Promise<Blob>} Merged image as PNG blob
 */
export async function mergeImagesSideBySide(files) {
  const images = await Promise.all(files.map(loadImageAsBitmap))
  const maxHeight = Math.max(...images.map(img => img.height))
  const totalWidth = images.reduce((sum, img) => sum + img.width, 0)

  const canvas = document.createElement('canvas')
  canvas.width = totalWidth
  canvas.height = maxHeight
  const ctx = canvas.getContext('2d')

  let x = 0
  for (const img of images) {
    ctx.drawImage(img, x, 0)
    x += img.width
  }

  return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

/**
 * Load an image file as an ImageBitmap.
 * @param {File} file
 * @returns {Promise<ImageBitmap>}
 */
async function loadImageAsBitmap(file) {
  const bitmap = await createImageBitmap(file)
  return bitmap
}

/**
 * Remove pages from a PDF using pdf-lib (client-side).
 * @param {File} pdfFile - PDF file
 * @param {number[]} pagesToRemove - 0-based page indices to remove
 * @returns {Promise<Blob>} Modified PDF as blob
 */
export async function removePdfPages(pdfFile, pagesToRemove) {
  const { PDFDocument } = await import('pdf-lib')
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  const pages = pdfDoc.getPages()

  // Sort descending so removing earlier pages doesn't shift later indices
  const sorted = [...pagesToRemove].sort((a, b) => b - a)
  for (const idx of sorted) {
    if (idx >= 0 && idx < pages.length) {
      pdfDoc.removePage(idx)
    }
  }

  const modifiedBytes = await pdfDoc.save()
  return new Blob([modifiedBytes], { type: 'application/pdf' })
}
