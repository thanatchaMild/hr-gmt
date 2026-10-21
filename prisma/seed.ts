import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// `npm run db:seed` runs tsx directly (not through the Prisma CLI), so load .env ourselves.
try {
  process.loadEnvFile()
} catch {
  // no .env file — fall back to the defaults below
}

const prisma = new PrismaClient()

// Passwords come from .env (SEED_PASSWORD_*) so real ones never land in git; unset → 'password'.
// permissionsScope: 'ALL' or a comma-separated list of hireType codes
// ('DAILY' | 'MONTHLY' | 'SUBCONTRACT' | 'FIXED_TERM').
const demoUsers = [
  { username: 'hr_daily', password: process.env.SEED_PASSWORD_HR_DAILY || 'password', name: 'กั้ง (HR สายรายวัน/รับเหมา/สัญญาจ้าง)', role: 'HR_ADMIN', permissionsScope: 'DAILY,SUBCONTRACT,FIXED_TERM' },
  { username: 'hr_monthly', password: process.env.SEED_PASSWORD_HR_MONTHLY || 'password', name: 'กุ้ง (HR สายรายเดือน)', role: 'HR_ADMIN', permissionsScope: 'MONTHLY' },
  { username: 'hr_manager', password: process.env.SEED_PASSWORD_HR_MANAGER || 'password', name: 'HR Manager', role: 'HR_ADMIN', permissionsScope: 'ALL' },
  { username: 'it_admin', password: process.env.SEED_PASSWORD_IT_ADMIN || 'password', name: 'IT Support', role: 'IT_ADMIN', permissionsScope: 'ALL' }
]

async function main() {
  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10)
    await prisma.user.upsert({
      where: { username: user.username },
      update: { name: user.name, role: user.role, permissionsScope: user.permissionsScope, passwordHash },
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

  // Test employee with complete data
  const testFormData = {
    personalInfo: {
      positionApplied: 'Full Stack Developer',
      availableStartDate: '2026-11-01',
      prefix: 'นาย',
      firstName: 'สมชาย',
      lastName: 'ทดสอบระบบ',
      prefixEn: 'Mr.',
      firstNameEn: 'Somchai',
      lastNameEn: 'Todsob',
      gender: 'ชาย',
      birthDate: '1995-03-15',
      age: 31,
      weight: 72,
      height: 175,
      idCardNumber: '1-1001-12345-67-8',
      idCardIssueDate: '2020-01-10',
      idCardExpiryDate: '2028-01-09',
      nationality: 'Thai',
      religion: 'Buddhism',
      placeOfBirth: 'กรุงเทพมหานคร',
      militaryStatus: 'Exempted',
      militaryServiceDate: ''
    },
    contactInfo: {
      presentAddress: '123/45 ซ.ลาดพร้าว 80 แขวงวังทองหลาง เขตวังทองหลาง กรุงเทพฯ 10310',
      permanentAddress: '88 หมู่ 5 ต.บางพลี อ.บางพลี จ.สมุทรปราการ 10540',
      email: 'somchai.test@example.com',
      homePhone: '02-123-4567',
      mobilePhone: '081-234-5678',
      socialMedia: { line: 'somchai_line', facebook: 'somchai.fb' }
    },
    familyInfo: {
      maritalStatus: 'SINGLE',
      father: { name: 'สมศักดิ์ ทดสอบระบบ', age: 58, occupation: 'ข้าราชการบำนาญ', address: '88 หมู่ 5 ต.บางพลี อ.บางพลี จ.สมุทรปราการ', phone: '081-111-2222' },
      mother: { name: 'สมหญิง ทดสอบระบบ', age: 55, occupation: 'แม่บ้าน', address: '88 หมู่ 5 ต.บางพลี อ.บางพลี จ.สมุทรปราการ', phone: '081-333-4444' },
      spouse: { name: '', age: null, occupation: '', address: '', phone: '' },
      siblingsTotal: 2,
      birthOrder: 1,
      siblings: [
        { name: 'สมหญิง ทดสอบระบบ', age: 28, occupation: 'พยาบาล', address: '88 หมู่ 5 ต.บางพลี', phone: '089-999-8888' }
      ],
      childrenTotal: 0,
      children: []
    },
    educationHistory: {
      continuingStudies: false,
      continuingDetails: '',
      records: [
        { level: 'มัธยมศึกษาตอนปลาย/ปวช.', institution: 'โรงเรียนสวนกุหลาบวิทยาลัย', degree: 'ม.6', major: 'วิทย์-คณิต', graduatedYear: '2013', gpa: '3.45' },
        { level: 'ปริญญาตรี', institution: 'มหาวิทยาลัยเกษตรศาสตร์', degree: 'วิทยาศาสตรบัณฑิต', major: 'วิทยาการคอมพิวเตอร์', graduatedYear: '2017', gpa: '3.25' }
      ]
    },
    trainingHistory: [
      { course: 'AWS Cloud Practitioner', institution: 'Amazon Web Services', certificate: 'AWS Certified', period: '3 วัน', year: '2024' },
      { course: 'Nuxt.js Advanced Workshop', institution: 'Online Course', certificate: 'Certificate of Completion', period: '5 วัน', year: '2025' }
    ],
    workHistory: [
      {
        company: 'บริษัท เทคโนโลยี จำกัด',
        businessType: 'พัฒนาซอฟต์แวร์',
        address: '99 อาคาร ABC ถ.รัชดาภิเษก กรุงเทพฯ',
        phone: '02-999-8888',
        responsibility: 'พัฒนาระบบ Web Application ด้วย Vue.js และ Node.js',
        startDate: '2017-07-01',
        endDate: '2020-06-30',
        firstPosition: 'Junior Developer',
        lastPosition: 'Developer',
        startingSalary: '25,000',
        lastSalary: '38,000',
        otherIncome: '',
        reasonForLeaving: 'ต้องการเติบโตในสายงาน'
      },
      {
        company: 'บริษัท ดิจิทัล โซลูชัน จำกัด',
        businessType: 'IT Consulting',
        address: '55 อาคาร XYZ ถ.สุขุมวิท กรุงเทพฯ',
        phone: '02-888-7777',
        responsibility: 'ออกแบบและพัฒนาระบบ Full Stack, Lead ทีมพัฒนา 3 คน',
        startDate: '2020-07-15',
        endDate: '2026-09-30',
        firstPosition: 'Senior Developer',
        lastPosition: 'Tech Lead',
        startingSalary: '45,000',
        lastSalary: '65,000',
        otherIncome: 'โบนัส 2 เดือน/ปี',
        reasonForLeaving: 'ได้รับข้อเสนอที่ดีกว่า'
      }
    ],
    skillsAndOther: {
      languages: [
        { language: 'ภาษาอังกฤษ (English)', speaking: 'Good', reading: 'Excellent', writing: 'Good' },
        { language: 'ภาษาญี่ปุ่น (Japanese)', speaking: 'Fair', reading: 'Fair', writing: 'Fair' }
      ],
      computerAbility: 'JavaScript, TypeScript, Vue.js, Nuxt.js, Node.js, PostgreSQL, Docker, Git, AWS',
      otherQualifications: 'TOEIC 780, AWS Cloud Practitioner Certified',
      drivingCar: { canDrive: true, ownCar: true, hasLicense: true, licenseNo: '12345678' },
      drivingMotorcycle: { canDrive: true, ownMotorcycle: false, hasLicense: true, licenseNo: '87654321' },
      workUpCountry: { permanent: true, temporary: true },
      seriousIllness: { hasHistory: false, details: '' },
      physicalDisability: 'ไม่มี',
      arrestHistory: { hasHistory: false, reason: '' },
      dischargeHistory: { hasHistory: false, reason: '' },
      friendsInCompany: { hasFriends: true, names: 'วิชัย รักงาน (แผนก IT)' },
      vacancySource: 'เว็บไซต์บริษัท',
      referrerName: 'วิชัย รักงาน',
      hobbies: 'อ่านหนังสือ, วิ่ง, เขียนโปรแกรม',
      furtherInformation: 'มีความสนใจด้าน AI/ML และพร้อมเรียนรู้เทคโนโลยีใหม่ๆ',
      referencePersons: [
        { name: 'ดร.ประสิทธิ์ ชาญเทคโน', address: '99 อาคาร ABC ถ.รัชดาภิเษก กรุงเทพฯ', position: 'CTO', phone: '081-555-6666', relation: 'หัวหน้างานเดิม' },
        { name: 'อ.สมปอง รู้จริง', address: 'มหาวิทยาลัยเกษตรศาสตร์ บางเขน', position: 'อาจารย์ที่ปรึกษา', phone: '081-777-8888', relation: 'อาจารย์' }
      ],
      emergencyContacts: [
        { name: 'สมศักดิ์ ทดสอบระบบ', relation: 'บิดา', address: '88 หมู่ 5 ต.บางพลี อ.บางพลี จ.สมุทรปราการ', phone: '081-111-2222' }
      ],
      bankAccount: { bankName: 'ธนาคารกสิกรไทย', branch: 'สาขาบางพลี', accountNumber: '012-3-45678-9' }
    },
    sensitiveInfo: {
      health: { underlyingDiseases: 'ไม่มี', colorBlind: false, allergies: 'แพ้ยาเพนิซิลิน', bloodType: 'O' },
      criminalRecord: 'ไม่มี'
    },
    pdpaSignature: null
  }

  const testEmployeeData = {
    firstName: 'สมชาย',
    lastName: 'ทดสอบระบบ',
    email: 'somchai.test@example.com',
    phone: '081-234-5678',
    hireType: 'MONTHLY',
    employeeType: 'MONTHLY',
    status: 'APPROVED',
    source: 'ONBOARDING',
    employeeCode: 'TEST-001',
    department: 'บริหาร-IT&Programer',
    branch: 'สำนักงานใหญ่',
    startDate: new Date('2026-10-01'),
    probationDate: new Date('2027-01-01'),
    pdpaConsent: true,
    pdpaConsentDate: new Date('2026-09-25'),
    formData: JSON.stringify(testFormData)
  }

  const existing = await prisma.employee.findFirst({ where: { employeeCode: 'TEST-001' } })
  if (existing) {
    await prisma.employee.update({ where: { id: existing.id }, data: testEmployeeData })
  } else {
    await prisma.employee.create({
      data: {
        ...testEmployeeData,
        documents: {
          create: [
            { documentType: 'idCard', fileUrl: '/uploads/sample-id-card.pdf' },
            { documentType: 'houseRegistration', fileUrl: '/uploads/sample-house-reg.pdf' },
            { documentType: 'degreeCertificate', fileUrl: '/uploads/sample-degree.pdf' },
            { documentType: 'transcript', fileUrl: '/uploads/sample-transcript.pdf' }
          ]
        },
        itRequests: {
          create: [
            {
              employeeName: 'สมชาย ทดสอบระบบ',
              type: 'ONBOARDING',
              status: 'COMPLETED',
              requestedItems: JSON.stringify(['Notebook', 'จอ Monitor', 'Email/Microsoft 365', 'VPN Access']),
              requestType: 'onboarding',
              department: 'บริหาร-IT&Programer'
            }
          ]
        }
      }
    })
  }

  console.log('Seeded test employee: สมชาย ทดสอบระบบ (ID: 9999)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
