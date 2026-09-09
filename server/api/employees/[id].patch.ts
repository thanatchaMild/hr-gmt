interface EmployeeUpdatePayload {
  employeeCode?: string
  department?: string
  branch?: string
  managerName?: string
  startDate?: string
  probationDate?: string
  contractEndDate?: string
  status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'OFFBOARDED'
}

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'HR_ADMIN')
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<EmployeeUpdatePayload>(event)

  const existing = await prisma.employee.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  if (isOutOfHireTypeScope(user, existing)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      ...(body.employeeCode !== undefined ? { employeeCode: body.employeeCode } : {}),
      ...(body.department !== undefined ? { department: body.department } : {}),
      ...(body.branch !== undefined ? { branch: body.branch } : {}),
      ...(body.managerName !== undefined ? { managerName: body.managerName } : {}),
      ...(body.startDate !== undefined ? { startDate: new Date(body.startDate) } : {}),
      ...(body.probationDate !== undefined ? { probationDate: new Date(body.probationDate) } : {}),
      ...(body.contractEndDate !== undefined ? { contractEndDate: new Date(body.contractEndDate) } : {}),
      ...(body.status !== undefined ? { status: body.status } : {})
    }
  })

  return { ...employee, formData: JSON.parse(employee.formData) }
})
