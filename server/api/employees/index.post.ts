interface OnboardingPayload {
  token?: string
  hireType?: string
  employeeType?: 'DAILY' | 'MONTHLY'
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

  const hireType = parseHireTypeFromThai(body?.hireType) ?? body?.employeeType ?? null
  if (!hireType || !body.personalInfo?.firstName || !body.contactInfo?.email) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required onboarding fields' })
  }

  // A token is optional — present only when the candidate came in through an HR-generated invite link.
  let invite = null
  if (body.token) {
    invite = await prisma.onboardingInvite.findUnique({ where: { token: body.token } })
    if (!invite || invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
      throw createError({ statusCode: 403, statusMessage: 'ลิงก์นี้ไม่ถูกต้อง หมดอายุ หรือถูกใช้ไปแล้ว' })
    }
  }

  const { token: _token, employeeCode: _employeeCode, personalInfo, contactInfo, documents, itRequest, employeeType: _employeeType, hireType: _hireType, pdpaConsent, pdpaConsentDate, ...rest } = body

  const employee = await prisma.employee.create({
    data: {
      firstName: personalInfo.firstName,
      lastName: personalInfo.lastName,
      email: contactInfo.email,
      phone: contactInfo.mobilePhone,
      hireType,
      employeeType: deriveEmployeeType(hireType),
      status: 'SUBMITTED',
      employeeCode: invite?.employeeCode,
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

  if (invite) {
    await prisma.onboardingInvite.update({
      where: { id: invite.id },
      data: { status: 'SUBMITTED', submittedAt: new Date(), employeeId: employee.id }
    })
  }

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
