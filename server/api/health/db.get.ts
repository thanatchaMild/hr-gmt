export default defineEventHandler(async (event) => {
  const connection = process.env.DB_CONNECTION_2 || 'sqlserver'
  const host = process.env.DB_HOST_2 || null
  const port = process.env.DB_PORT_2 || null
  const database = process.env.DB_DATABASE_2 || null
  const username = process.env.DB_USERNAME_2 || null

  const target = { connection, host, port, database, username }

  const missing = ['DB_HOST_2', 'DB_PORT_2', 'DB_DATABASE_2', 'DB_USERNAME_2', 'DB_PASSWORD_2']
    .filter((key) => !process.env[key])

  if (missing.length) {
    setResponseStatus(event, 503)
    return {
      ok: false,
      stage: 'config',
      message: `ตัวแปรสภาพแวดล้อมยังไม่ครบ: ${missing.join(', ')}`,
      target
    }
  }

  const start = Date.now()
  try {
    await prismaSecondary!.$queryRaw`SELECT 1 AS ok`
    return {
      ok: true,
      stage: 'connected',
      message: 'เชื่อมต่อฐานข้อมูลสำเร็จ',
      target,
      elapsedMs: Date.now() - start
    }
  } catch (err) {
    setResponseStatus(event, 503)
    return {
      ok: false,
      stage: 'connect',
      message: err instanceof Error ? err.message : String(err),
      target,
      elapsedMs: Date.now() - start
    }
  }
})
