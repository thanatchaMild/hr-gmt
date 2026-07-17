interface RenewContractPayload {
  newEndDate: string
  note?: string
}

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'HR_ADMIN')
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<RenewContractPayload>(event)

  if (!body?.newEndDate) {
    throw createError({ statusCode: 400, statusMessage: 'newEndDate is required' })
  }

  const employee = await prisma.employee.findUnique({ where: { id } })
  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }
  if (employee.employeeType !== 'DAILY') {
    throw createError({ statusCode: 400, statusMessage: 'Only daily employees have renewable contracts' })
  }

  const scopeType = scopeEmployeeTypeFilter(user)
  if (scopeType && employee.employeeType !== scopeType) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const [renewal] = await prisma.$transaction([
    prisma.contractRenewal.create({
      data: {
        employeeId: id,
        previousEndDate: employee.contractEndDate,
        newEndDate: new Date(body.newEndDate),
        note: body.note,
        renewedBy: user.name
      }
    }),
    prisma.employee.update({
      where: { id },
      data: { contractEndDate: new Date(body.newEndDate) }
    })
  ])

  return renewal
})
