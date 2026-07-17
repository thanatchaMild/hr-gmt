interface UpdateInvitePayload {
  action: 'revoke' | 'regenerate'
}

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'HR_ADMIN')
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<UpdateInvitePayload>(event)

  const existing = await prisma.onboardingInvite.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Invite not found' })
  }

  if (body.action === 'revoke') {
    if (existing.status === 'SUBMITTED') {
      throw createError({ statusCode: 400, statusMessage: 'ลิงก์นี้ถูกใช้ส่งใบสมัครไปแล้ว ยกเลิกไม่ได้' })
    }
    const invite = await prisma.onboardingInvite.update({
      where: { id },
      data: { status: 'REVOKED' }
    })
    return { invite }
  }

  if (body.action === 'regenerate') {
    if (existing.status === 'SUBMITTED') {
      throw createError({ statusCode: 400, statusMessage: 'ลิงก์นี้ถูกใช้ส่งใบสมัครไปแล้ว สร้างใหม่ไม่ได้' })
    }
    if (existing.status === 'PENDING') {
      await prisma.onboardingInvite.update({ where: { id }, data: { status: 'REVOKED' } })
    }
    const invite = await prisma.onboardingInvite.create({
      data: {
        token: generateInviteToken(),
        employeeCode: existing.employeeCode,
        firstName: existing.firstName,
        lastName: existing.lastName,
        status: 'PENDING',
        expiresAt: generateInviteExpiry(),
        createdBy: user.name
      }
    })
    return { invite }
  }

  throw createError({ statusCode: 400, statusMessage: 'Invalid action' })
})
