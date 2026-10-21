import sql from 'mssql'

// One pool per external database, keyed by the env-var suffix (DB_HOST_<SUFFIX>, DB_DATABASE_<SUFFIX>, ...).
// These databases belong to other systems (AppSheet, myapp) — hr-management only reads them.
const pools = new Map<string, Promise<sql.ConnectionPool>>()

export function getMssqlPool(suffix: string, label: string): Promise<sql.ConnectionPool> {
  const cached = pools.get(suffix)
  if (cached) return cached

  const host = process.env[`DB_HOST_${suffix}`]
  const port = parseInt(process.env[`DB_PORT_${suffix}`] || '1433')
  const database = process.env[`DB_DATABASE_${suffix}`]
  const user = process.env[`DB_USERNAME_${suffix}`]
  const password = process.env[`DB_PASSWORD_${suffix}`]

  if (!host || !database || !user || !password) {
    throw createError({ statusCode: 500, statusMessage: `${label} DB is not configured` })
  }

  const pending = new sql.ConnectionPool({
    server: host,
    port,
    database,
    user,
    password,
    options: { encrypt: true, trustServerCertificate: true },
    connectionTimeout: 10000,
    requestTimeout: 15000,
    pool: { min: 1, max: 5 },
  }).connect()

  pools.set(suffix, pending)
  // Drop a failed or later-broken pool so the next request reconnects.
  pending.then(
    pool => pool.on('error', () => pools.delete(suffix)),
    () => pools.delete(suffix),
  )
  return pending
}
