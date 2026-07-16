import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const UPLOAD_DIR = join(process.cwd(), 'server', 'uploads')

export default defineEventHandler(async (event) => {
  const files = await readMultipartFormData(event)
  const file = files?.find((f) => f.name === 'file')

  if (!file || !file.filename) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  await mkdir(UPLOAD_DIR, { recursive: true })

  const safeName = file.filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const storedName = `${randomUUID()}-${safeName}`
  await writeFile(join(UPLOAD_DIR, storedName), file.data)

  return { url: `/api/uploads/${storedName}` }
})
