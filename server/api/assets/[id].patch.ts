interface UpdateAssetPayload {
  status?: 'IN_STOCK' | 'ASSIGNED' | 'MAINTENANCE'
  assignedTo?: string | null
  department?: string | null
}

export default defineEventHandler(async (event) => {
  await requireRole(event, 'IT_ADMIN')
  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateAssetPayload>(event)

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.assignedTo !== undefined ? { assignedTo: body.assignedTo } : {}),
      ...(body.department !== undefined ? { department: body.department } : {})
    }
  })

  return asset
})
