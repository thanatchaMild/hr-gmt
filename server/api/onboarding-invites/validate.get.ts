export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = query.token as string | undefined

  if (!token) {
    return { valid: false, reason: 'MISSING' }
  }

  const invite = await prisma.onboardingInvite.findUnique({ where: { token } })

  if (!invite) {
    return { valid: false, reason: 'NOT_FOUND' }
  }

  if (invite.status === 'SUBMITTED') {
    return { valid: false, reason: 'ALREADY_SUBMITTED' }
  }

  if (invite.status === 'REVOKED') {
    return { valid: false, reason: 'REVOKED' }
  }

  if (invite.status === 'EXPIRED' || invite.expiresAt < new Date()) {
    if (invite.status !== 'EXPIRED') {
      await prisma.onboardingInvite.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } })
    }
    return { valid: false, reason: 'EXPIRED' }
  }

  return {
    valid: true,
    employeeCode: invite.employeeCode,
    firstName: invite.firstName,
    lastName: invite.lastName
  }
})
