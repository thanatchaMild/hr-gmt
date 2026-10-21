interface UpdateFormDataPayload {
  token?: string
  hireType?: string
  personalInfo?: { firstName?: string; lastName?: string }
  contactInfo?: { email?: string; mobilePhone?: string }
  familyInfo: unknown
  educationHistory: unknown
  trainingHistory: unknown
  workHistory: unknown
  skillsAndOther: unknown
  sensitiveInfo: unknown
  documents: Record<string, string | null>
}

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<UpdateFormDataPayload>(event)

  const existing = await prisma.employee.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  if (body.token) {
    const invite = await prisma.onboardingInvite.findUnique({ where: { token: body.token } })
    if (!invite || invite.status !== 'PENDING' || invite.employeeId !== id || invite.expiresAt < new Date()) {
      throw createError({ statusCode: 403, statusMessage: 'ลิงก์ไม่ถูกต้อง หมดอายุ หรือถูกใช้ไปแล้ว' })
    }
    await prisma.onboardingInvite.update({
      where: { id: invite.id },
      data: { status: 'SUBMITTED', submittedAt: new Date() }
    })
  } else {
    const { user } = await requireRole(event, 'HR_ADMIN')
    if (isOutOfHireTypeScope(user, existing)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
  }

  const {
    personalInfo, contactInfo, familyInfo, educationHistory,
    trainingHistory, workHistory, skillsAndOther, sensitiveInfo, documents
  } = body

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      firstName: personalInfo?.firstName ?? existing.firstName,
      lastName: personalInfo?.lastName ?? existing.lastName,
      email: contactInfo?.email ?? existing.email,
      phone: contactInfo?.mobilePhone ?? existing.phone,
      formData: JSON.stringify({
        personalInfo, contactInfo, familyInfo, educationHistory,
        trainingHistory, workHistory, skillsAndOther, sensitiveInfo
      }),
      documents: {
        deleteMany: {},
        create: Object.entries(documents || {})
          .filter(([, url]) => typeof url === 'string' && url)
          .map(([documentType, fileUrl]) => ({ documentType, fileUrl: fileUrl as string }))
      }
    }
  })

  return { id: employee.id }
})
