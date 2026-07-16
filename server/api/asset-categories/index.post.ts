interface CreateCategoryPayload {
  name: string
  code: string
}

export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')
  const body = await readBody<CreateCategoryPayload>(event)

  if (!body?.name || !body.code) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  const category = await prisma.assetCategory.create({
    data: { name: body.name, code: body.code }
  })

  return category
})
