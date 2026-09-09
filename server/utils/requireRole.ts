import type { H3Event } from 'h3'
import type { Role } from '../db/schema'

export async function requireRole(event: H3Event, role: Role) {
  const session = await requireUserSession(event)

  if (session.user.role !== role) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return { user: session.user }
}

// Which hireType codes this user may see/manage. `null` means no restriction (all).
export function scopeHireTypes(user: { role: Role; permissionsScope: string }): string[] | null {
  if (user.role !== 'HR_ADMIN') return null
  const scope = (user.permissionsScope || '').trim()
  if (!scope || scope === 'ALL') return null
  // Backward-compat with the old two-value enum.
  if (scope === 'DAILY_ONLY') return ['DAILY', 'SUBCONTRACT', 'FIXED_TERM']
  if (scope === 'MONTHLY_ONLY') return ['MONTHLY']
  return scope.split(',').map(s => s.trim()).filter(Boolean)
}

// True when `employee` (its hireType, falling back to employeeType) is outside the user's scope.
export function isOutOfHireTypeScope(
  user: { role: Role; permissionsScope: string },
  employee: { hireType: string | null; employeeType: string }
): boolean {
  const allowed = scopeHireTypes(user)
  if (!allowed) return false
  return !allowed.includes(employee.hireType ?? employee.employeeType)
}
