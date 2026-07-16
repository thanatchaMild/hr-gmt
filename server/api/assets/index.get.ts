export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const assets = await prisma.asset.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  })

  return { assets }
})
