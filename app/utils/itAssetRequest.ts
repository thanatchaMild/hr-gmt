// Mirrors myapp's ItAssetRequestController::STATUSES / ItAssetRequestHeader::REQUEST_TYPES — keep in sync.
export const ASSET_REQUEST_STATUSES = [
  'draft', 'รอ IT ตรวจสอบ', 'รออนุมัติ', 'อนุมัติแล้ว', 'กำลังจัดสรร',
  'เสร็จสิ้น', 'ไม่ผ่านการตรวจสอบ', 'ไม่อนุมัติ', 'ยกเลิก',
] as const

export const ASSET_REQUEST_TYPES = [
  'ขอใช้อุปกรณ์ (Hardware)',
  'ขอใช้ Email/VPN/License (Software)',
  'ขอยืมอุปกรณ์ (Hardware)',
  'ขอยืม Email/VPN/License (Software)',
  'ขอคืนอุปกรณ์ที่ยืม',
  'ขอคืนอุปกรณ์ที่ขอใช้',
] as const

const STATUS_CLASSES: Record<string, string> = {
  'draft': 'bg-slate-100 text-slate-500',
  'รอ IT ตรวจสอบ': 'bg-amber-100 text-amber-700',
  'รออนุมัติ': 'bg-amber-100 text-amber-700',
  'อนุมัติแล้ว': 'bg-blue-100 text-blue-700',
  'กำลังจัดสรร': 'bg-indigo-100 text-indigo-700',
  'เสร็จสิ้น': 'bg-green-100 text-green-700',
  'ไม่ผ่านการตรวจสอบ': 'bg-red-100 text-red-700',
  'ไม่อนุมัติ': 'bg-red-100 text-red-700',
  'ยกเลิก': 'bg-slate-100 text-slate-500',
}

export function requestStatusClass(status: string | null | undefined) {
  return (status && STATUS_CLASSES[status]) || 'bg-slate-100 text-slate-600'
}

export function priorityClass(priority: string | null | undefined) {
  if (priority === 'ด่วนมาก') return 'bg-red-100 text-red-700'
  if (priority === 'ด่วน') return 'bg-amber-100 text-amber-800'
  return 'bg-slate-100 text-slate-500'
}

// Same rule as myapp's memoStatusInfo(): the signed MEMO only matters once the request is approved.
export function memoStatus(req: { status: string; memo_count?: number | null; memo_confirmed?: number | null }) {
  if (!['อนุมัติแล้ว', 'กำลังจัดสรร', 'เสร็จสิ้น'].includes(req.status)) return null
  if (req.memo_count === null || req.memo_count === undefined) return null
  if (!req.memo_count) return { label: 'ยังไม่แนบ', cls: 'bg-red-50 text-red-600' }
  return req.memo_confirmed === req.memo_count
    ? { label: 'ยืนยันแล้ว', cls: 'bg-green-50 text-green-700' }
    : { label: 'รอยืนยัน', cls: 'bg-amber-50 text-amber-700' }
}

// Same facts myapp's lineFacts() shows for a line's form_data JSON.
export function lineFacts(formData: any): { label: string; value: string }[] {
  const f = formData
  if (!f || typeof f !== 'object') return []
  const facts: { label: string; value: string }[] = []
  if (f.usage_profile?.length) facts.push({ label: 'ลักษณะงาน', value: f.usage_profile.join(', ') })
  if (f.software?.selected?.length) facts.push({ label: 'ซอฟต์แวร์', value: f.software.selected.join(', ') })
  if (f.software?.other) facts.push({ label: 'โปรแกรมอื่นๆ', value: f.software.other })
  if (f.accessories?.selected?.length) facts.push({ label: 'อุปกรณ์เสริม', value: f.accessories.selected.join(', ') })
  if (f.accessories?.other) facts.push({ label: 'อุปกรณ์เสริมอื่นๆ', value: f.accessories.other })
  if (f.reason) facts.push({ label: 'เหตุผล', value: f.reason + (f.reason_other ? ` — ${f.reason_other}` : '') })
  if (f.extra_request) {
    const e = f.extra_request
    facts.push({
      label: 'ผู้ขอเพิ่ม',
      value: [e.user_name, e.department ? `แผนก ${e.department}` : '', e.employee_code, e.purpose_location].filter(Boolean).join(' · '),
    })
  }
  return facts
}
