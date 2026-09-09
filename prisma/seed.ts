import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// permissionsScope: 'ALL' or a comma-separated list of hireType codes
// ('DAILY' | 'MONTHLY' | 'SUBCONTRACT' | 'FIXED_TERM').
const demoUsers = [
  { username: 'kang', name: 'กั้ง (HR สายรายวัน/รับเหมา/สัญญาจ้าง)', role: 'HR_ADMIN', permissionsScope: 'DAILY,SUBCONTRACT,FIXED_TERM' },
  { username: 'kung', name: 'กุ้ง (HR สายรายเดือน)', role: 'HR_ADMIN', permissionsScope: 'MONTHLY' },
  { username: 'manager', name: 'HR Manager', role: 'HR_ADMIN', permissionsScope: 'ALL' },
  { username: 'it', name: 'IT Support', role: 'IT_ADMIN', permissionsScope: 'ALL' }
]

async function main() {
  const passwordHash = await bcrypt.hash('password', 10)

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: { name: user.name, role: user.role, permissionsScope: user.permissionsScope },
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
