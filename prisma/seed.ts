import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const demoUsers = [
  { username: 'kang', name: 'กั้ง (HR พนักงานรายวัน)', role: 'HR_ADMIN', permissionsScope: 'DAILY_ONLY' },
  { username: 'kung', name: 'กุ้ง (HR พนักงานรายเดือน)', role: 'HR_ADMIN', permissionsScope: 'MONTHLY_ONLY' },
  { username: 'manager', name: 'HR Manager', role: 'HR_ADMIN', permissionsScope: 'ALL' },
  { username: 'it', name: 'IT Support', role: 'IT_ADMIN', permissionsScope: 'ALL' }
]

async function main() {
  const passwordHash = await bcrypt.hash('password', 10)

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        name: user.name,
        email: `${user.username}@example.com`,
        passwordHash,
        role: user.role,
        permissionsScope: user.permissionsScope
      }
    })
  }

  console.log(`Seeded ${demoUsers.length} demo users.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
