export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')
  const id = Number(getRouterParam(event, 'id'))

  await prisma.asset.delete({ where: { id } })

  return { ok: true }
})
