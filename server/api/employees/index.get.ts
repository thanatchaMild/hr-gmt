export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const query = getQuery(event)
  const status = query.status as string | undefined
  const statuses = status?.split(',').filter(Boolean)

  // Optional filter by record origin — the "ใบสมัครใหม่" list passes source=ONBOARDING
  // so legacy IMPORT employees don't show up as applications.
  const source = query.source as string | undefined
  const sources = source?.split(',').filter(Boolean)

  const allowedHireTypes = scopeHireTypes(user)
  const requestedHireType = query.hireType as string | undefined
  const hireTypeFilter = allowedHireTypes
    ? (requestedHireType && allowedHireTypes.includes(requestedHireType) ? [requestedHireType] : allowedHireTypes)
    : (requestedHireType ? [requestedHireType] : undefined)

  const employees = await prisma.employee.findMany({
    where: {
      ...(statuses?.length ? { status: { in: statuses } } : {}),
      ...(sources?.length ? { source: { in: sources } } : {}),
      ...(hireTypeFilter ? { hireType: { in: hireTypeFilter } } : {})
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      employeeCode: true,
      employeeType: true,
      hireType: true,
      status: true,
      source: true,
      department: true,
      branch: true,
      managerName: true,
      startDate: true,
      probationDate: true,
      contractEndDate: true,
      createdAt: true
    }
  })

  return { employees }
})
