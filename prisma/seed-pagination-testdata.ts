import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { deriveEmployeeType, hireTypeDateField } from '../server/utils/hireType'

const prisma = new PrismaClient()

/**
 * Bulk test data for exercising the 10-per-page pagination on every list screen.
 * Everything created here is tagged so the script is idempotent — a re-run wipes
 * the previous batch and rebuilds it. The hand-written TEST-001..005 fixtures
 * from seed-test-employees.ts are left untouched.
 *
 *   employees (APPROVED)   -> /admin/hr/employees          (+31  => ~4 pages)
 *   employees (SUBMITTED)  -> /admin/hr/applications        (+24  => several pages)
 *   onboarding_invites     -> /admin/hr/onboarding-invites  (+24  => 3 pages)
 *   asset_categories       -> /admin/it/categories          (+24  => 3 pages)
 *   assets                 -> /admin/it/assets              (+36  => 4 pages)
 *   it_requests            -> /admin/it/requests + /admin/hr/it-requests (+24 => 3 pages)
 *
 * Markers: employeeCode / assetTag / category code start with "PGT", invites and
 * IT requests carry createdBy/requestedBy = "seed-pagination".
 */

const MARKER = 'seed-pagination'
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d))

const FIRST_NAMES = [
  'สมชาย', 'สมหญิง', 'ธนวัฒน์', 'ปิยะ', 'อรทัย', 'กิตติ', 'นภา', 'วีรพงษ์', 'ศิริพร', 'ชัยวัฒน์',
  'พรทิพย์', 'อนุสรณ์', 'จันทรา', 'ณัฐพล', 'มณีรัตน์', 'สุรชัย', 'กาญจนา', 'ภาณุพงศ์', 'รัตนา', 'ธีรศักดิ์',
  'วราภรณ์', 'ประเสริฐ', 'สุนิสา', 'อภิชาติ', 'เบญจวรรณ', 'จิรายุ', 'ปาริชาติ', 'ทศพล', 'อรอนงค์', 'พงษ์ศักดิ์',
  'ดวงใจ', 'สิทธิชัย', 'นฤมล', 'เอกชัย', 'สุพัตรา', 'วิชัย', 'กนกวรรณ', 'ไพโรจน์', 'ชนิดา', 'ธนกร'
]
const LAST_NAMES = [
  'ใจดี', 'ศรีสุข', 'ทองมาก', 'แซ่ลิ้ม', 'พรหมมา', 'บุญมี', 'รักไทย', 'สุขสันต์', 'มั่นคง', 'เจริญพร',
  'วงศ์ทอง', 'แก้วมณี', 'สินทรัพย์', 'ภักดี', 'ประเสริฐ', 'ก้าวหน้า', 'ทรงศิริ', 'พัฒนา', 'เลิศวิไล', 'อุดมทรัพย์',
  'ชูเกียรติ', 'ธรรมรักษา', 'คงเดช', 'สังข์ทอง', 'บวรรัตน์', 'จันทร์เพ็ญ', 'เพชรน้ำหนึ่ง', 'มหาชัย', 'ดำรงค์', 'วิเศษสุข'
]

const DEPARTMENTS = [
  'บริหาร-IT&Programer', 'ผลิต-โรงผง1', 'ประกันคุณภาพ', 'supply chain คลังสินค้า', 'การตลาด',
  'จัดซื้อ', 'ทรัพยากรบุคคล', 'วิศวกรรมไฟฟ้า', 'บัญชีโรงงาน', 'วางแผนผลิต'
]
const BRANCHES = ['โรงงาน นว.', 'ออฟฟิศ กทม.', 'คลังบางพลี']
const HIRE_TYPES = ['DAILY', 'MONTHLY', 'SUBCONTRACT', 'FIXED_TERM']

const name = (i: number) => ({
  firstName: FIRST_NAMES[i % FIRST_NAMES.length],
  lastName: LAST_NAMES[(i * 7 + 3) % LAST_NAMES.length]
})

async function wipePreviousBatch() {
  await prisma.iTRequest.deleteMany({ where: { requestedBy: MARKER } })
  await prisma.onboardingInvite.deleteMany({ where: { createdBy: MARKER } })
  await prisma.document.deleteMany({ where: { employee: { employeeCode: { startsWith: 'PGT-' } } } })
  await prisma.employee.deleteMany({ where: { employeeCode: { startsWith: 'PGT-' } } })
  await prisma.asset.deleteMany({ where: { assetTag: { startsWith: 'PGT-' } } })
  await prisma.assetCategory.deleteMany({ where: { code: { startsWith: 'PGT' } } })
}

async function seedEmployees() {
  const rows: any[] = []

  // 31 APPROVED (current staff) -> employees list
  for (let i = 0; i < 31; i++) {
    const n = name(i)
    const hireType = HIRE_TYPES[i % HIRE_TYPES.length]
    const field = hireTypeDateField(hireType)
    const startDate = utc(2024 + (i % 3), (i % 12) + 1, (i % 27) + 1)
    rows.push({
      firstName: n.firstName,
      lastName: n.lastName,
      email: `pgt.a${String(i + 1).padStart(3, '0')}@example.com`,
      phone: `08${(10000000 + i * 137).toString().slice(0, 8)}`,
      hireType,
      employeeType: deriveEmployeeType(hireType),
      status: 'APPROVED',
      employeeCode: `PGT-A${String(i + 1).padStart(3, '0')}`,
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      branch: BRANCHES[i % BRANCHES.length],
      startDate,
      probationDate: field === 'probation' ? utc(2024 + (i % 3), ((i + 3) % 12) + 1, 15) : null,
      contractEndDate: field === 'contract' ? utc(2026, ((i + 2) % 12) + 1, 20) : null,
      pdpaConsent: true,
      pdpaConsentDate: startDate,
      formData: JSON.stringify({ source: MARKER })
    })
  }

  // 24 SUBMITTED (pending applications) -> applications list
  for (let i = 0; i < 24; i++) {
    const n = name(i + 5)
    const hireType = HIRE_TYPES[(i + 1) % HIRE_TYPES.length]
    rows.push({
      firstName: n.firstName,
      lastName: n.lastName,
      email: `pgt.s${String(i + 1).padStart(3, '0')}@example.com`,
      phone: `09${(20000000 + i * 173).toString().slice(0, 8)}`,
      hireType,
      employeeType: deriveEmployeeType(hireType),
      status: 'SUBMITTED',
      employeeCode: `PGT-S${String(i + 1).padStart(3, '0')}`,
      department: DEPARTMENTS[(i + 4) % DEPARTMENTS.length],
      branch: BRANCHES[(i + 1) % BRANCHES.length],
      startDate: utc(2026, (i % 12) + 1, (i % 27) + 1),
      pdpaConsent: true,
      pdpaConsentDate: utc(2026, (i % 12) + 1, (i % 27) + 1),
      formData: JSON.stringify({ source: MARKER })
    })
  }

  for (const data of rows) await prisma.employee.create({ data })
  return rows.length
}

async function seedInvites() {
  const statuses = ['PENDING', 'PENDING', 'PENDING', 'SUBMITTED', 'EXPIRED', 'REVOKED']
  let count = 0
  for (let i = 0; i < 24; i++) {
    const n = name(i + 11)
    const status = statuses[i % statuses.length]
    await prisma.onboardingInvite.create({
      data: {
        token: randomUUID(),
        employeeCode: `PGT-I${String(i + 1).padStart(3, '0')}`,
        firstName: n.firstName,
        lastName: n.lastName,
        status,
        expiresAt: utc(2026, (i % 12) + 1, (i % 27) + 1),
        submittedAt: status === 'SUBMITTED' ? utc(2026, (i % 12) + 1, (i % 27) + 1) : null,
        createdBy: MARKER
      }
    })
    count++
  }
  return count
}

async function seedCategories() {
  const bases = [
    'Computer', 'Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Printer', 'Scanner', 'Server',
    'Network Switch', 'Router', 'Access Point', 'UPS', 'Projector', 'Webcam', 'Headset',
    'Docking Station', 'External Drive', 'Tablet', 'Mobile Phone', 'IP Phone',
    'Label Printer', 'Barcode Scanner', 'NAS', 'Firewall'
  ]
  const created: { id: number }[] = []
  for (let i = 0; i < bases.length; i++) {
    const c = await prisma.assetCategory.create({
      data: { name: bases[i], code: `PGT${String(i + 1).padStart(2, '0')}`, status: 'Active' }
    })
    created.push(c)
  }
  return created
}

async function seedAssets(categoryIds: number[]) {
  const types = ['Notebook', 'Desktop PC', 'Monitor 24"', 'Monitor 27"', 'Laser Printer', 'Wi-Fi AP', 'Switch 24-port', 'UPS 1kVA']
  const assignees = ['สมชาย ใจดี', 'ธนกร ศรีสุข', null, 'วิภาดา ทองมาก', null, 'อนุชา แซ่ลิ้ม']
  const statuses = ['IN_STOCK', 'ASSIGNED', 'IN_STOCK', 'MAINTENANCE', 'ASSIGNED']
  let count = 0
  for (let i = 0; i < 36; i++) {
    const status = statuses[i % statuses.length]
    await prisma.asset.create({
      data: {
        assetTag: `PGT-${String(i + 1).padStart(4, '0')}`,
        assetType: types[i % types.length],
        categoryId: categoryIds[i % categoryIds.length] ?? null,
        status,
        assignedTo: status === 'ASSIGNED' ? (assignees[i % assignees.length] ?? 'พนักงานทดสอบ') : null,
        department: DEPARTMENTS[i % DEPARTMENTS.length]
      }
    })
    count++
  }
  return count
}

async function seedITRequests() {
  const types = ['ONBOARDING', 'OFFBOARDING', 'ASSET_REQUEST']
  const reqStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED']
  const itemSets = [
    ['Notebook', 'Email Account', 'VPN Access'],
    ['ปิด Email/Account', 'ระงับสิทธิ์ ERP', 'ติดตามรับคืนทรัพย์สิน'],
    ['Monitor 27"', 'Docking Station'],
    ['ERP Account', 'Line Official Access']
  ]
  let count = 0
  for (let i = 0; i < 24; i++) {
    const n = name(i + 2)
    await prisma.iTRequest.create({
      data: {
        employeeName: `${n.firstName} ${n.lastName}`,
        type: types[i % types.length],
        status: reqStatuses[i % reqStatuses.length],
        requestedItems: JSON.stringify(itemSets[i % itemSets.length]),
        requestType: types[i % types.length].toLowerCase(),
        department: DEPARTMENTS[i % DEPARTMENTS.length],
        requestedBy: MARKER,
        priority: ['NORMAL', 'NORMAL', 'URGENT', 'CRITICAL'][i % 4],
        notes: `รายการทดสอบ pagination #${i + 1}`
      }
    })
    count++
  }
  return count
}

async function main() {
  console.log('Wiping previous PGT batch...')
  await wipePreviousBatch()

  const emp = await seedEmployees()
  console.log(`employees        +${emp}  (31 APPROVED + 24 SUBMITTED)`)

  const inv = await seedInvites()
  console.log(`onboarding_invites +${inv}`)

  const cats = await seedCategories()
  console.log(`asset_categories +${cats.length}`)

  const assets = await seedAssets(cats.map(c => c.id))
  console.log(`assets           +${assets}`)

  const reqs = await seedITRequests()
  console.log(`it_requests      +${reqs}`)

  console.log('\nDone. Log in as "manager" / password to see all hire types on the employees page.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
