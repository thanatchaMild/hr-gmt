export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = Number(getRouterParam(event, 'id'))

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      documents: true,
      itRequests: true,
      contractRenewals: { orderBy: { createdAt: 'desc' } }
    }
  })

  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  if (isOutOfHireTypeScope(user, employee)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return {
    ...employee,
    formData: JSON.parse(employee.formData),
    itRequests: employee.itRequests.map((r) => ({ ...r, requestedItems: JSON.parse(r.requestedItems) }))
  }
})
