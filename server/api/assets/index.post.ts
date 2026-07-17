interface CreateAssetPayload {
  assetTag: string
  assetType: string
  categoryId?: string | number
}

export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')
  const body = await readBody<CreateAssetPayload>(event)

  if (!body?.assetTag || !body.assetType) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const asset = await prisma.asset.create({
    data: {
      assetTag: body.assetTag,
      assetType: body.assetType,
      categoryId: body.categoryId !== undefined && body.categoryId !== '' ? Number(body.categoryId) : undefined,
      status: 'IN_STOCK'
    }
  })

  return asset
})
