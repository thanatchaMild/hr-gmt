interface RequestedItemInput {
  category?: string
  name?: string
  quantity?: number
  note?: string
}

interface AttachmentInput {
  name?: string
  url?: string
}

interface CreateITRequestPayload {
  employeeId?: string | number
  employeeName: string
  type?: 'ONBOARDING' | 'OFFBOARDING' | 'ASSET_REQUEST'
  requestedItems?: string[]
  items?: RequestedItemInput[]
  requestType?: string
  department?: string
  approver?: string
  notes?: string
  requestFor?: 'SELF' | 'OTHER'
  requesterName?: string
  requesterEmployeeCode?: string
  contactEmail?: string
  priority?: 'NORMAL' | 'URGENT' | 'CRITICAL'
  neededDate?: string
  returnDate?: string
  attachments?: AttachmentInput[]
}

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'HR_ADMIN')
  const body = await readBody<CreateITRequestPayload>(event)

  if (!body?.employeeName) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const type = body.type || 'ASSET_REQUEST'

  const items = Array.isArray(body.items) && body.items.length
    ? body.items.map(i => ({
        category: (i.category || '').trim(),
        name: (i.name || '').trim(),
        quantity: Number(i.quantity) > 0 ? Number(i.quantity) : 1,
        note: (i.note || '').trim()
      }))
    : (body.requestedItems || [])

  const attachments = (body.attachments || [])
    .filter(a => a && a.url)
    .map(a => ({ name: a.name || 'ไฟล์แนบ', url: a.url as string }))

  const request = await prisma.iTRequest.create({
    data: {
      employeeId: body.employeeId !== undefined && body.employeeId !== '' ? Number(body.employeeId) : undefined,
      employeeName: body.employeeName,
      type,
      status: 'PENDING',
      requestedItems: JSON.stringify(items),
      requestType: body.requestType,
      department: body.department,
      approver: body.approver,
      notes: body.notes,
      requestedBy: user.name,
      requestFor: body.requestFor === 'OTHER' ? 'OTHER' : 'SELF',
      requesterName: body.requesterName?.trim() || user.name,
      requesterEmployeeCode: body.requesterEmployeeCode?.trim() || null,
      contactEmail: body.contactEmail?.trim() || null,
      priority: body.priority || 'NORMAL',
      neededDate: body.neededDate ? new Date(body.neededDate) : null,
      returnDate: body.returnDate ? new Date(body.returnDate) : null,
      attachments: JSON.stringify(attachments)
    }
  })

  return { ...request, requestedItems: JSON.parse(request.requestedItems) }
})
