export default defineEventHandler(async (event) => {
  await requireRole(event, 'HR_ADMIN')

  // Lazily flip any invites whose expiry has passed instead of relying on a cron job.
  await prisma.onboardingInvite.updateMany({
    where: { status: 'PENDING', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' }
  })

  const invites = await prisma.onboardingInvite.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return { invites }
})
