interface CreateITRequestPayload {
  employeeId?: string | number
  employeeName: string
  type: 'ONBOARDING' | 'OFFBOARDING'
  requestedItems: string[]
  requestType?: string
  department?: string
  approver?: string
  notes?: string
}

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readBody<CreateITRequestPayload>(event)

  if (!body?.employeeName || !body.type) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const request = await prisma.iTRequest.create({
    data: {
      employeeId: body.employeeId !== undefined && body.employeeId !== '' ? Number(body.employeeId) : undefined,
      employeeName: body.employeeName,
      type: body.type,
      status: 'PENDING',
      requestedItems: JSON.stringify(body.requestedItems || []),
      requestType: body.requestType,
      department: body.department,
      approver: body.approver,
      notes: body.notes,
      requestedBy: user.name
    }
  })

  return { ...request, requestedItems: JSON.parse(request.requestedItems) }
})
