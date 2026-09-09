import { readFile } from 'node:fs/promises'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const name = getRouterParam(event, 'path')
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Missing file path' })
  }

  const filePath = resolveUploadPath(decodeURIComponent(name))
  if (!filePath) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid file path' })
  }

  let data: Buffer
  try {
    data = await readFile(filePath)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw createError({ statusCode: 404, statusMessage: 'File not found' })
    }
    throw err
  }

  setResponseHeader(event, 'Content-Type', contentTypeFor(name))
  setResponseHeader(event, 'Content-Disposition', 'inline')
  setResponseHeader(event, 'Cache-Control', 'private, max-age=86400')
  return data
})
