export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')
  const id = Number(getRouterParam(event, 'id'))

  const holdings = await prisma.assetHolding.findMany({
    where: { itRequestId: id },
    orderBy: { createdAt: 'desc' }
  })

  return { holdings }
})
