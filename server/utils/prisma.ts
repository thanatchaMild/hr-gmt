import { PrismaClient } from '@prisma/client'

// Builds a SQL Server connection string from the split DB_* env vars.
// suffix is '' for the primary connection, '_2' for the secondary one.
function buildDbUrl(suffix: '' | '_2'): string | null {
  const connection = process.env[`DB_CONNECTION${suffix}`] || 'sqlserver'
  const host = process.env[`DB_HOST${suffix}`]
  const port = process.env[`DB_PORT${suffix}`]
  const database = process.env[`DB_DATABASE${suffix}`]
  const username = process.env[`DB_USERNAME${suffix}`]
  const password = process.env[`DB_PASSWORD${suffix}`]

  if (!host || !database || !username || !password) return null

  return `${connection}://${host}:${port};database=${database};user=${username};password=${password};trustServerCertificate=true;encrypt=true`
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaSecondary?: PrismaClient }

const primaryUrl = buildDbUrl('')

export const prisma = globalForPrisma.prisma
  ?? new PrismaClient(primaryUrl ? { datasources: { db: { url: primaryUrl } } } : undefined)

// Second database connection (e.g. a read replica). Only set up when the DB_*_2
// vars are filled in; nothing in the app uses this yet.
const secondaryUrl = buildDbUrl('_2')

export const prismaSecondary = secondaryUrl
  ? (globalForPrisma.prismaSecondary ?? new PrismaClient({ datasources: { db: { url: secondaryUrl } } }))
  : null

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  if (prismaSecondary) globalForPrisma.prismaSecondary = prismaSecondary
}
