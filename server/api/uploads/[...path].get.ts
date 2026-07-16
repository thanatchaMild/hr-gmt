import { readFile } from 'node:fs/promises'
import { join, normalize } from 'node:path'

const UPLOAD_DIR = join(process.cwd(), 'server', 'uploads')

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const path = getRouterParam(event, 'path')
  if (!path) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file path' })
  }

  const filePath = normalize(join(UPLOAD_DIR, path))
  if (!filePath.startsWith(UPLOAD_DIR)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid file path' })
  }

  try {
    return await readFile(filePath)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }
})
