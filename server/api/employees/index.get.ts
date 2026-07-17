export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const query = getQuery(event)
  const status = query.status as string | undefined
  const statuses = status?.split(',').filter(Boolean)
  const employeeType = scopeEmployeeTypeFilter(user) ?? (query.type as string | undefined)

  const employees = await prisma.employee.findMany({
    where: {
      ...(statuses?.length ? { status: { in: statuses } } : {}),
      ...(employeeType ? { employeeType } : {})
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      employeeType: true,
      status: true,
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
