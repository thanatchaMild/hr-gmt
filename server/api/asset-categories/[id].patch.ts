interface UpdateCategoryPayload {
  name?: string
  code?: string
  status?: string
}

export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')
  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateCategoryPayload>(event)

  const category = await prisma.assetCategory.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.code !== undefined ? { code: body.code } : {}),
      ...(body.status !== undefined ? { status: body.status } : {})
    }
  })

  return category
})
