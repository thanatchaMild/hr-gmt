export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const categories = await prisma.assetCategory.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { createdAt: 'asc' }
  })

  return {
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      status: c.status,
      count: c._count.assets
    }))
  }
})
