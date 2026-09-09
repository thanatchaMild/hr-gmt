// One-off: populate Employee.hireType for rows created before the column existed.
// Existing employees only ever had employeeType (DAILY/MONTHLY), which are valid
// hireType codes, so copy it across.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.employee.findMany({
    where: { hireType: null },
    select: { id: true, employeeType: true }
  })

  for (const row of rows) {
    await prisma.employee.update({
      where: { id: row.id },
      data: { hireType: row.employeeType }
    })
  }

  console.log(`Backfilled hireType for ${rows.length} employee(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
