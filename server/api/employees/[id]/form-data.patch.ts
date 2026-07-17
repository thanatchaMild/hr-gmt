interface UpdateFormDataPayload {
  personalInfo: { firstName: string; lastName: string }
  contactInfo: { email: string; mobilePhone: string }
  familyInfo: unknown
  educationHistory: unknown
  trainingHistory: unknown
  workHistory: unknown
  skillsAndOther: unknown
  sensitiveInfo: unknown
  documents: Record<string, string | null>
}

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'HR_ADMIN')
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<UpdateFormDataPayload>(event)

  if (!body?.personalInfo?.firstName || !body.contactInfo?.email) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const existing = await prisma.employee.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const scopeType = scopeEmployeeTypeFilter(user)
  if (scopeType && existing.employeeType !== scopeType) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const {
    personalInfo, contactInfo, familyInfo, educationHistory,
    trainingHistory, workHistory, skillsAndOther, sensitiveInfo, documents
  } = body

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      firstName: personalInfo.firstName,
      lastName: personalInfo.lastName,
      email: contactInfo.email,
      phone: contactInfo.mobilePhone,
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
