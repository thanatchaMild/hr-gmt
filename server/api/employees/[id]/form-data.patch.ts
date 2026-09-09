interface UpdateFormDataPayload {
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
  const { user } = await requireRole(event, 'HR_ADMIN')
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<UpdateFormDataPayload>(event)

  // HR edit form: no field is mandatory — accept whatever is submitted.

  const existing = await prisma.employee.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  if (isOutOfHireTypeScope(user, existing)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
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
