interface ImportRow {
  employeeCode?: string
  prefix?: string
  firstName?: string
  lastName?: string
  hireType?: string
  startDate?: string
  department?: string
  position?: string
  phone?: string
  probationDate?: string
  contractEndDate?: string
}

interface ImportPayload {
  // Every row carries its own hireType from the sheet's "สถานะการจ้าง" column (free text ok).
  rows: ImportRow[]
}

// Sheet dates come as d/m/yyyy with either a Buddhist (2567) or Western (2024) year.
// Returns null when the value can't be read as a date — the row is imported without a start date.
function parseSheetDate(raw?: string): Date | null {
  const value = raw?.trim()
  if (!value) return null
  const m = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  let year = Number(m[3])
  if (year < 100) year += 2000
  if (year > 2400) year -= 543 // พ.ศ. -> ค.ศ.
  const date = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(date.getTime()) || date.getUTCMonth() !== month - 1) return null
  return date
}

export default defineEventHandler(async (event) => {
  await requireRole(event, 'HR_ADMIN')
  const body = await readBody<ImportPayload>(event)

  if (!Array.isArray(body?.rows) || body.rows.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'ไม่พบข้อมูลแถวที่จะนำเข้า' })
  }

  // Codes already in the DB are skipped so re-running the same file doesn't create duplicates.
  const existing = await prisma.employee.findMany({
    where: { employeeCode: { not: null } },
    select: { employeeCode: true }
  })
  const existingCodes = new Set(existing.map(e => e.employeeCode))
  const seenInFile = new Set<string>()

  const created: { row: number; employeeCode: string | null; id: number }[] = []
  const skipped: { row: number; employeeCode: string | null; reason: string }[] = []
  const failed: { row: number; employeeCode: string | null; reason: string }[] = []

  for (let i = 0; i < body.rows.length; i++) {
    const rowNo = i + 1
    const raw = body.rows[i] || {}
    const employeeCode = raw.employeeCode?.trim() || null
    const firstName = raw.firstName?.trim() || ''
    const lastName = raw.lastName?.trim() || ''

    if (!firstName || !lastName) {
      failed.push({ row: rowNo, employeeCode, reason: 'ไม่มีชื่อหรือนามสกุล' })
      continue
    }
    if (!employeeCode) {
      failed.push({ row: rowNo, employeeCode, reason: 'ไม่มีรหัสพนักงาน' })
      continue
    }
    if (existingCodes.has(employeeCode)) {
      skipped.push({ row: rowNo, employeeCode, reason: 'มีรหัสพนักงานนี้ในระบบแล้ว' })
      continue
    }
    if (seenInFile.has(employeeCode)) {
      skipped.push({ row: rowNo, employeeCode, reason: 'รหัสพนักงานซ้ำในไฟล์' })
      continue
    }

    const rawHireType = raw.hireType?.trim()
    const hireType = resolveHireType(rawHireType)
    if (!hireType) {
      failed.push({ row: rowNo, employeeCode, reason: rawHireType ? `อ่านสถานะการจ้างไม่ได้: "${rawHireType}"` : 'ไม่มีสถานะการจ้าง' })
      continue
    }
    const dateField = hireTypeDateField(hireType)

    try {
      const employee = await prisma.employee.create({
        data: {
          firstName,
          lastName,
          email: '',
          phone: raw.phone?.trim() || '',
          hireType,
          employeeType: deriveEmployeeType(hireType),
          status: 'APPROVED',
          source: 'IMPORT',
          employeeCode,
          department: raw.department?.trim() || null,
          startDate: parseSheetDate(raw.startDate),
          probationDate: dateField === 'probation' ? parseSheetDate(raw.probationDate) : null,
          contractEndDate: dateField === 'contract' ? parseSheetDate(raw.contractEndDate) : null,
          formData: JSON.stringify({
            source: 'legacy-csv-import',
            importedAt: new Date().toISOString(),
            prefix: raw.prefix?.trim() || null,
            position: raw.position?.trim() || null,
            department: raw.department?.trim() || null,
            hireTypeRaw: rawHireType || null,
            startDateRaw: raw.startDate?.trim() || null,
            probationDateRaw: raw.probationDate?.trim() || null,
            contractEndDateRaw: raw.contractEndDate?.trim() || null
          })
        }
      })
      seenInFile.add(employeeCode)
      existingCodes.add(employeeCode)
      created.push({ row: rowNo, employeeCode, id: employee.id })
    } catch (err) {
      failed.push({ row: rowNo, employeeCode, reason: err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ' })
    }
  }

  return {
    summary: { total: body.rows.length, created: created.length, skipped: skipped.length, failed: failed.length },
    created,
    skipped,
    failed
  }
})
