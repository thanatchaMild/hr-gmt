export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const query = getQuery(event)
  const type = query.type as string | undefined
  const status = query.status as string | undefined

  const requests = await prisma.iTRequest.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(status ? { status } : {})
    },
    orderBy: { createdAt: 'desc' }
  })

  return {
    requests: requests.map((r) => ({ ...r, requestedItems: JSON.parse(r.requestedItems) }))
  }
})
