interface OnboardingPayload {
  employeeType: 'DAILY' | 'MONTHLY'
  personalInfo: { firstName: string; lastName: string }
  contactInfo: { email: string; mobilePhone: string }
  pdpaConsent: boolean
  pdpaConsentDate: string | null
  documents: Record<string, string | null>
  itRequest: { equipment: string[]; softwareAccounts: string[] }
  [key: string]: unknown
}

export default defineEventHandler(async (event) => {
  const body = await readBody<OnboardingPayload>(event)

  if (!body?.employeeType || !body.personalInfo?.firstName || !body.contactInfo?.email) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required onboarding fields' })
  }

  const { personalInfo, contactInfo, documents, itRequest, employeeType, pdpaConsent, pdpaConsentDate, ...rest } = body

  const employee = await prisma.employee.create({
    data: {
      firstName: personalInfo.firstName,
      lastName: personalInfo.lastName,
      email: contactInfo.email,
      phone: contactInfo.mobilePhone,
      employeeType,
      status: 'SUBMITTED',
      pdpaConsent: !!pdpaConsent,
      pdpaConsentDate: pdpaConsentDate ? new Date(pdpaConsentDate) : null,
      formData: JSON.stringify({ personalInfo, contactInfo, ...rest }),
      documents: {
        create: Object.entries(documents || {})
          .filter(([, url]) => typeof url === 'string' && url)
          .map(([documentType, fileUrl]) => ({ documentType, fileUrl: fileUrl as string }))
      }
    }
  })

  const requestedItems = [...(itRequest?.equipment || []), ...(itRequest?.softwareAccounts || [])]
  if (requestedItems.length > 0) {
    await prisma.iTRequest.create({
      data: {
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        type: 'ONBOARDING',
        status: 'PENDING',
        requestedItems: JSON.stringify(requestedItems),
        requestType: 'onboarding',
        department: employee.department
      }
    })
  }

  return { id: employee.id }
})
