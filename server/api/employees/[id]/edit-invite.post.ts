export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'HR_ADMIN')
  const id = Number(getRouterParam(event, 'id'))

  const employee = await prisma.employee.findUnique({
    where: { id },
    select: { id: true, employeeCode: true, firstName: true, lastName: true }
  })

  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const invite = await prisma.onboardingInvite.create({
    data: {
      token: generateInviteToken(),
      employeeCode: employee.employeeCode || '',
      firstName: employee.firstName,
      lastName: employee.lastName,
      status: 'PENDING',
      expiresAt: generateInviteExpiry(),
      createdBy: user.name,
      employeeId: employee.id
    }
  })

  return { invite }
})
