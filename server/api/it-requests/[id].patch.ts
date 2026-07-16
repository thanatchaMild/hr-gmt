export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' }>(event)

  const request = await prisma.iTRequest.update({
    where: { id },
    data: { status: body.status }
  })

  return { ...request, requestedItems: JSON.parse(request.requestedItems) }
})
