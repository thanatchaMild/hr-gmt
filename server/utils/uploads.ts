import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { isAbsolute, join, resolve, sep, extname } from 'node:path'

// Where uploaded files live on disk.
//
// Production deploys run from `.output/` and do NOT contain the source `server/`
// folder, so a path built from `process.cwd() + 'server/uploads'` points at a
// directory that is wiped on every redeploy — that is what produced the 404s
// when opening an uploaded photo. Set NUXT_UPLOAD_DIR to a persistent absolute
// path (a mounted volume) in production; dev falls back to server/uploads so
// existing local files keep working with no migration.
function resolveUploadDir(): string {
  const configured = process.env.NUXT_UPLOAD_DIR?.trim()
  if (configured) {
    return isAbsolute(configured) ? configured : resolve(process.cwd(), configured)
  }
  return join(process.cwd(), 'server', 'uploads')
}

export const UPLOAD_DIR = resolveUploadDir()

// Legacy location tried on read so files uploaded before NUXT_UPLOAD_DIR was set
// still resolve.
const LEGACY_UPLOAD_DIR = join(process.cwd(), 'server', 'uploads')

export async function ensureUploadDir(): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true })
}

// Resolves a stored file name to an on-disk path, rejecting anything that would
// escape the uploads directory (`..`, absolute paths, etc.). Returns the first
// location where the file actually exists (primary dir, then legacy dir), or the
// primary path if it is nowhere — the caller turns a missing file into a 404.
export function resolveUploadPath(name: string): string | null {
  const primary = resolve(UPLOAD_DIR, name)
  if (primary !== UPLOAD_DIR && !primary.startsWith(UPLOAD_DIR + sep)) return null

  if (existsSync(primary)) return primary

  if (LEGACY_UPLOAD_DIR !== UPLOAD_DIR) {
    const legacy = resolve(LEGACY_UPLOAD_DIR, name)
    if (
      (legacy === LEGACY_UPLOAD_DIR || legacy.startsWith(LEGACY_UPLOAD_DIR + sep)) &&
      existsSync(legacy)
    ) {
      return legacy
    }
  }

  return primary
}

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf'
}

export function contentTypeFor(name: string): string {
  return MIME_BY_EXT[extname(name).toLowerCase()] ?? 'application/octet-stream'
}

// Accepted uploads: images (the common case — ID card, photo, bank book) plus PDF.
export const ALLOWED_UPLOAD_MIME = new Set(Object.values(MIME_BY_EXT))
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024 // 15 MB
