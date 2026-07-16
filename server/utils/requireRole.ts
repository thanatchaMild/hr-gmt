import type { H3Event } from 'h3'
import type { Role } from '../db/schema'

export async function requireRole(event: H3Event, role: Role) {
  const session = await requireUserSession(event)

  if (session.user.role !== role) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return { user: session.user }
}

export function scopeEmployeeTypeFilter(user: { role: Role; permissionsScope: string }) {
  if (user.role !== 'HR_ADMIN' || user.permissionsScope === 'ALL') return undefined
  return user.permissionsScope === 'DAILY_ONLY' ? 'DAILY' : 'MONTHLY'
}
