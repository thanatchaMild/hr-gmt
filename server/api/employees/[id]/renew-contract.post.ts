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
  if (hireTypeDateField(employee.hireType ?? employee.employeeType) !== 'contract') {
    throw createError({ statusCode: 400, statusMessage: 'พนักงานประเภทนี้ไม่มีสัญญาจ้างที่ต่ออายุได้' })
  }

  if (isOutOfHireTypeScope(user, employee)) {
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
