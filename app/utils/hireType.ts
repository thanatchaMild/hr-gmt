// Employment type (สถานะการจ้าง). Four codes, stored on Employee.hireType.
// Employee.employeeType (DAILY/MONTHLY) is derived from this — it stays the axis
// that drives probation vs. contract handling and payroll.
export const HIRE_TYPES = [
  { code: 'DAILY', label: 'รายวัน' },
  { code: 'MONTHLY', label: 'รายเดือน' },
  { code: 'SUBCONTRACT', label: 'รับเหมา' },
  { code: 'FIXED_TERM', label: 'สัญญาจ้าง' }
] as const

export type HireType = typeof HIRE_TYPES[number]['code']

export const HIRE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  HIRE_TYPES.map(t => [t.code, t.label])
)

export function hireTypeLabel(code?: string | null): string {
  if (!code) return ''
  return HIRE_TYPE_LABELS[code] ?? code
}

// Maps the Thai wording from HR's spreadsheet (or a raw code) to a hireType code.
// Returns null when the value isn't recognised.
export function parseHireTypeFromThai(text?: string | null): HireType | null {
  const value = text?.trim()
  if (!value) return null
  if (value in HIRE_TYPE_LABELS) return value as HireType
  const byLabel = HIRE_TYPES.find(t => t.label === value)
  return byLabel ? byLabel.code : null
}

// Looser resolver for free-text HR columns like "สัญญาจ้าง 6 เดือน" or "ทดลองงาน 119 วัน".
export function resolveHireType(text?: string | null): HireType | null {
  const t = (text ?? '').trim()
  if (!t) return null
  const exact = parseHireTypeFromThai(t)
  if (exact) return exact
  if (t.includes('รับเหมา') || t.includes('เหมาช่วง') || /outsource/i.test(t)) return 'SUBCONTRACT'
  if (t.includes('รายวัน')) return 'DAILY'
  if (t.includes('สัญญาจ้าง') || t.includes('สัญญา')) return 'FIXED_TERM'
  if (t.includes('ทดลองงาน') || t.includes('รายเดือน') || t.includes('ประจำ') || t.includes('บรรจุ')) return 'MONTHLY'
  return null
}

// Only รายเดือน maps to MONTHLY; everything else behaves like a daily/contract hire.
export function deriveEmployeeType(hireType?: string | null): 'DAILY' | 'MONTHLY' {
  return hireType === 'MONTHLY' ? 'MONTHLY' : 'DAILY'
}

// Which dated milestone applies to a hire type:
//   รายเดือน       -> probation date (วันผ่านทดลองงาน)
//   รายวัน/สัญญาจ้าง -> contract end date (วันหมดสัญญา) + renewable
//   รับเหมา         -> none
export function hireTypeDateField(hireType?: string | null): 'probation' | 'contract' | null {
  if (hireType === 'MONTHLY') return 'probation'
  if (hireType === 'DAILY' || hireType === 'FIXED_TERM') return 'contract'
  return null
}
