// Server-side copy of the hireType helpers (server code can't import from app/utils).
// Keep in sync with app/utils/hireType.ts.
export const HIRE_TYPE_CODES = ['DAILY', 'MONTHLY', 'SUBCONTRACT', 'FIXED_TERM'] as const
export type HireType = typeof HIRE_TYPE_CODES[number]

const THAI_LABELS: Record<string, HireType> = {
  'รายวัน': 'DAILY',
  'รายเดือน': 'MONTHLY',
  'รับเหมา': 'SUBCONTRACT',
  'สัญญาจ้าง': 'FIXED_TERM'
}

export function parseHireTypeFromThai(text?: string | null): HireType | null {
  const value = text?.trim()
  if (!value) return null
  if ((HIRE_TYPE_CODES as readonly string[]).includes(value)) return value as HireType
  return THAI_LABELS[value] ?? null
}

// Looser resolver for free-text HR columns like "สัญญาจ้าง 6 เดือน" / "ทดลองงาน 119 วัน".
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

export function deriveEmployeeType(hireType?: string | null): 'DAILY' | 'MONTHLY' {
  return hireType === 'MONTHLY' ? 'MONTHLY' : 'DAILY'
}

// รายเดือน -> probation, รายวัน/สัญญาจ้าง -> contract, รับเหมา -> none
export function hireTypeDateField(hireType?: string | null): 'probation' | 'contract' | null {
  if (hireType === 'MONTHLY') return 'probation'
  if (hireType === 'DAILY' || hireType === 'FIXED_TERM') return 'contract'
  return null
}
