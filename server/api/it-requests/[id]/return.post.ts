export default defineEventHandler(async (event) => {
  const session = await requireRole(event, 'IT_ADMIN')
  const id = Number(getRouterParam(event, 'id'))

  const body = await readBody<{
    items: { assetName: string; assetTag?: string; category?: string; quantity?: number; returnCondition: string }[]
    returnedDate: string
    notes?: string
  }>(event)

  if (!body.items?.length) {
    throw createError({ statusCode: 400, statusMessage: 'กรุณาระบุรายการทรัพย์สินอย่างน้อย 1 รายการ' })
  }

  const request = await prisma.iTRequest.findUnique({ where: { id } })
  if (!request) throw createError({ statusCode: 404, statusMessage: 'ไม่พบคำขอ' })

  const holdings = await prisma.$transaction(async (tx) => {
    const created = await Promise.all(
      body.items.map(item =>
        tx.assetHolding.create({
          data: {
            itRequestId: id,
            employeeName: request.requesterName || request.employeeName,
            assetName: item.assetName,
            assetTag: item.assetTag || null,
            category: item.category || null,
            quantity: item.quantity || 1,
            status: 'RETURNED',
            returnedDate: new Date(body.returnedDate),
            returnCondition: item.returnCondition,
            notes: body.notes || null,
            processedBy: session.user?.name || 'IT Admin',
          }
        })
      )
    )

    await tx.iTRequest.update({
      where: { id },
      data: { status: 'COMPLETED' }
    })

    return created
  })

  return { holdings }
})
