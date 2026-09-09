import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const files = await readMultipartFormData(event)
  const file = files?.find((f) => f.name === 'file')

  if (!file || !file.filename) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  if (file.data.length > MAX_UPLOAD_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'ไฟล์ใหญ่เกินไป (สูงสุด 15 MB)' })
  }

  // Trust the extension when the browser doesn't send a usable mime type.
  const typeOk =
    (file.type && ALLOWED_UPLOAD_MIME.has(file.type)) ||
    contentTypeFor(file.filename) !== 'application/octet-stream'
  if (!typeOk) {
    throw createError({ statusCode: 415, statusMessage: 'รองรับเฉพาะไฟล์รูปภาพหรือ PDF' })
  }

  await ensureUploadDir()

  const safeName = file.filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const storedName = `${randomUUID()}-${safeName}`
  await writeFile(join(UPLOAD_DIR, storedName), file.data)

  return { url: `/api/uploads/${storedName}` }
})
