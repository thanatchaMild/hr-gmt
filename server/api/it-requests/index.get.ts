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

  const safeParse = (value: string | null, fallback: unknown) => {
    if (!value) return fallback
    try { return JSON.parse(value) } catch { return fallback }
  }

  return {
    requests: requests.map((r) => ({
      ...r,
      requestedItems: safeParse(r.requestedItems, []),
      attachments: safeParse(r.attachments, [])
    }))
  }
})
