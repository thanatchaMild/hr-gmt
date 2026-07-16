export default defineEventHandler(async (event) => {
  await requireRole(event, 'HR_ADMIN')

  const now = new Date()
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [probationDue, contractDue] = await Promise.all([
    prisma.employee.findMany({
      where: { status: 'APPROVED', probationDate: { gte: now, lte: sevenDaysOut } }
    }),
    prisma.employee.findMany({
      where: { status: 'APPROVED', contractEndDate: { gte: now, lte: sevenDaysOut } }
    })
  ])

  const alerts = [
    ...probationDue.map((emp) => ({
      id: `probation-${emp.id}`,
      type: 'PROBATION_WARNING' as const,
      message: `Employee ${emp.firstName} ${emp.lastName} is approaching probation end date (${emp.probationDate?.toISOString().slice(0, 10)}).`,
      employeeId: emp.id,
      createdAt: new Date().toISOString(),
      read: false
    })),
    ...contractDue.map((emp) => ({
      id: `contract-${emp.id}`,
      type: 'CONTRACT_WARNING' as const,
      message: `Employee ${emp.firstName} ${emp.lastName} contract expires soon (${emp.contractEndDate?.toISOString().slice(0, 10)}).`,
      employeeId: emp.id,
      createdAt: new Date().toISOString(),
      read: false
    }))
  ]

  return { alerts }
})
