import { PrismaClient } from '@prisma/client'
import { deriveEmployeeType, hireTypeDateField } from '../server/utils/hireType'

const prisma = new PrismaClient()

// 5 APPROVED employees for manual/UI testing (pagination, filters, contract alerts).
// Idempotent: rows are matched by employeeCode and skipped if they already exist.
// Reference date for the fixtures below: 2026-09-09.
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d))

const testEmployees = [
  {
    employeeCode: 'TEST-001',
    prefix: 'นาย',
    firstName: 'ธนกร',
    lastName: 'ศรีสุข',
    position: 'Software Developer',
    hireType: 'MONTHLY',
    department: 'บริหาร-IT&Programer',
    branch: 'ออฟฟิศ กทม.',
    email: 'thanakorn.s@example.com',
    phone: '081-234-5601',
    startDate: utc(2026, 1, 6),
    probationDate: utc(2026, 4, 5),
    contractEndDate: null
  },
  {
    employeeCode: 'TEST-002',
    prefix: 'นาย',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    position: 'พนักงานฝ่ายผลิต',
    hireType: 'DAILY',
    department: 'ผลิต-โรงผง1',
    branch: 'โรงงาน นว.',
    email: 'somchai.j@example.com',
    phone: '081-234-5602',
    startDate: utc(2025, 9, 15),
    probationDate: null,
    // Ends within a week of the reference date -> exercises the red "ใกล้หมดสัญญา" state.
    contractEndDate: utc(2026, 9, 15)
  },
  {
    employeeCode: 'TEST-003',
    prefix: 'นางสาว',
    firstName: 'วิภาดา',
    lastName: 'ทองมาก',
    position: 'เจ้าหน้าที่ประกันคุณภาพ',
    hireType: 'FIXED_TERM',
    department: 'ประกันคุณภาพ',
    branch: 'โรงงาน นว.',
    email: 'wipada.t@example.com',
    phone: '081-234-5603',
    startDate: utc(2026, 3, 1),
    probationDate: null,
    contractEndDate: utc(2027, 3, 1)
  },
  {
    employeeCode: 'TEST-004',
    prefix: 'นาย',
    firstName: 'อนุชา',
    lastName: 'แซ่ลิ้ม',
    position: 'พนักงานคลังสินค้า (รับเหมา)',
    hireType: 'SUBCONTRACT',
    department: 'supply chain คลังสินค้า',
    branch: 'คลังบางพลี',
    email: 'anucha.l@example.com',
    phone: '081-234-5604',
    startDate: utc(2026, 6, 1),
    probationDate: null,
    contractEndDate: null
  },
  {
    employeeCode: 'TEST-005',
    prefix: 'นางสาว',
    firstName: 'กมลชนก',
    lastName: 'พรหมมา',
    position: 'เจ้าหน้าที่การตลาด',
    hireType: 'MONTHLY',
    department: 'การตลาด',
    branch: 'ออฟฟิศ กทม.',
    email: 'kamonchanok.p@example.com',
    phone: '081-234-5605',
    startDate: utc(2026, 8, 1),
    // Still on probation as of the reference date.
    probationDate: utc(2026, 10, 30),
    contractEndDate: null
  }
]

async function main() {
  let created = 0
  let skipped = 0

  for (const emp of testEmployees) {
    const existing = await prisma.employee.findFirst({ where: { employeeCode: emp.employeeCode } })
    if (existing) {
      skipped++
      console.log(`skip  ${emp.employeeCode} (${emp.firstName} ${emp.lastName}) — already exists`)
      continue
    }

    const dateField = hireTypeDateField(emp.hireType)
    await prisma.employee.create({
      data: {
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        hireType: emp.hireType,
        employeeType: deriveEmployeeType(emp.hireType),
        status: 'APPROVED',
        employeeCode: emp.employeeCode,
        department: emp.department,
        branch: emp.branch,
        startDate: emp.startDate,
        probationDate: dateField === 'probation' ? emp.probationDate : null,
        contractEndDate: dateField === 'contract' ? emp.contractEndDate : null,
        pdpaConsent: true,
        pdpaConsentDate: emp.startDate,
        formData: JSON.stringify({
          source: 'seed-test-employees',
          seededAt: new Date().toISOString(),
          personalInfo: { prefix: emp.prefix, firstName: emp.firstName, lastName: emp.lastName },
          contactInfo: { email: emp.email, mobilePhone: emp.phone },
          jobInfo: { position: emp.position, department: emp.department, branch: emp.branch }
        })
      }
    })
    created++
    console.log(`add   ${emp.employeeCode} (${emp.firstName} ${emp.lastName}) — ${emp.hireType}`)
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
