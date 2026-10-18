/**
 * @typedef {Object} Upload
 * @property {string} id - Unique identifier for the upload
 * @property {string} filename - Original filename
 * @property {number} size - File size in bytes
 * @property {string} type - MIME type of the file
 * @property {string} uploadedAt - ISO timestamp of upload
 * @property {string} url - Public URL to access the file
 */

/**
 * @typedef {Object} UploadResponse
 * @property {string} id
 * @property {string} filename
 * @property {number} size
 * @property {string} type
 */

/**
 * @typedef {Object} UploadListResponse
 * @property {Upload[]} uploads
 */
