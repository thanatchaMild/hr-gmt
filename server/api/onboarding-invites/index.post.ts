interface CreateInvitePayload {
  employeeCode: string
  firstName: string
  lastName: string
}

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'HR_ADMIN')
  const body = await readBody<CreateInvitePayload>(event)

  if (!body?.employeeCode?.trim() || !body?.firstName?.trim() || !body?.lastName?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณากรอกรหัสพนักงานและชื่อ-นามสกุลให้ครบถ้วน' })
  }

  const invite = await prisma.onboardingInvite.create({
    data: {
      token: generateInviteToken(),
      employeeCode: body.employeeCode.trim(),
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      status: 'PENDING',
      expiresAt: generateInviteExpiry(),
      createdBy: user.name
    }
  })

  return { invite }
})
