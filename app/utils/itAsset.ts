// Shared display helpers for AppSheet IT assets (status names come from appsheet_asset_status).
export const ASSET_STATUS_COLORS: Record<string, string> = {
  'ใช้งานอยู่': 'bg-green-100 text-green-700',
  'ชำรุด': 'bg-red-100 text-red-700',
  'ซ่อมบำรุง': 'bg-orange-100 text-orange-700',
  'เลิกใช้งาน': 'bg-slate-100 text-slate-500',
  'สูญหาย': 'bg-red-100 text-red-700',
  'สำรอง': 'bg-blue-100 text-blue-700',
  'คืน': 'bg-yellow-100 text-yellow-700',
}

export function assetStatusClass(name: string | null | undefined) {
  return (name && ASSET_STATUS_COLORS[name]) || 'bg-slate-100 text-slate-600'
}

// Stable color per label (asset type, branch, person): same name → same color everywhere.
const PALETTE = [
  { soft: 'bg-violet-50 text-violet-700', solid: 'bg-violet-500', avatar: 'bg-violet-100 text-violet-700' },
  { soft: 'bg-sky-50 text-sky-700', solid: 'bg-sky-500', avatar: 'bg-sky-100 text-sky-700' },
  { soft: 'bg-emerald-50 text-emerald-700', solid: 'bg-emerald-500', avatar: 'bg-emerald-100 text-emerald-700' },
  { soft: 'bg-amber-50 text-amber-700', solid: 'bg-amber-500', avatar: 'bg-amber-100 text-amber-700' },
  { soft: 'bg-rose-50 text-rose-700', solid: 'bg-rose-500', avatar: 'bg-rose-100 text-rose-700' },
  { soft: 'bg-indigo-50 text-indigo-700', solid: 'bg-indigo-500', avatar: 'bg-indigo-100 text-indigo-700' },
  { soft: 'bg-teal-50 text-teal-700', solid: 'bg-teal-500', avatar: 'bg-teal-100 text-teal-700' },
  { soft: 'bg-fuchsia-50 text-fuchsia-700', solid: 'bg-fuchsia-500', avatar: 'bg-fuchsia-100 text-fuchsia-700' },
  { soft: 'bg-orange-50 text-orange-700', solid: 'bg-orange-500', avatar: 'bg-orange-100 text-orange-700' },
  { soft: 'bg-cyan-50 text-cyan-700', solid: 'bg-cyan-500', avatar: 'bg-cyan-100 text-cyan-700' },
]

export function paletteFor(label: string | null | undefined) {
  if (!label) return { soft: 'bg-slate-100 text-slate-600', solid: 'bg-slate-400', avatar: 'bg-slate-100 text-slate-500' }
  let h = 0
  for (const ch of label) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]!
}

// Avatar letter for a Thai name, skipping honorifics.
export function nameInitial(name: string | null | undefined) {
  return (name || '').replace(/^(คุณ|นาย|นางสาว|นาง|น\.ส\.)\s*/, '').trim().charAt(0) || '?'
}

// AppSheet's own placeholder note for the first row it writes when an asset is created.
export const INITIAL_TRANSFER_NOTE = 'เพิ่มข้อมูลครั้งแรก'

export function formatThaiDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatBaht(val: number | null | undefined) {
  if (val === null || val === undefined) return '—'
  return Number(val).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// How to show a warranty end date: only "expiring soon" is highlighted; expired is muted (most old assets are).
export function warrantyBadge(dateStr: string | null | undefined): { label: string; cls: string } | null {
  const days = warrantyDaysLeft(dateStr)
  if (days === null) return null
  if (days < 0) return { label: 'หมดประกัน', cls: 'bg-slate-100 text-slate-500' }
  if (days < 90) return { label: `เหลือ ${days} วัน`, cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' }
  return null
}

// Days until a warranty ends (negative = already expired), or null when unknown.
export function warrantyDaysLeft(dateStr: string | null | undefined) {
  if (!dateStr) return null
  const end = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((end.getTime() - today.getTime()) / 86400000)
}
