<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
import RequirePermission from '~/components/admin/RequirePermission.vue'
import PageHeader from '~/components/admin/PageHeader.vue'
import StatCard from '~/components/admin/StatCard.vue'
import EmptyState from '~/components/admin/EmptyState.vue'
import { resolveHireType, hireTypeLabel } from '~/utils/hireType'

interface ImportField {
  key: string
  label: string
  required: boolean
}

// Fields the importer produces. Source columns are matched to these by header
// text (see HEADER_ALIASES), so the order/position of columns in the file — and
// extra columns — don't matter.
const FIELDS: ImportField[] = [
  { key: 'employeeCode', label: 'รหัสพนักงาน', required: true },
  { key: 'prefix', label: 'คำนำหน้า', required: false },
  { key: 'firstName', label: 'ชื่อ', required: true },
  { key: 'lastName', label: 'นามสกุล', required: true },
  { key: 'hireStatus', label: 'สถานะการจ้าง', required: true },
  { key: 'startDate', label: 'วันที่เริ่มงาน', required: false },
  { key: 'department', label: 'แผนก', required: false },
  { key: 'position', label: 'ตำแหน่ง', required: false },
  { key: 'phone', label: 'เบอร์โทร', required: false },
  { key: 'probationDate', label: 'วันผ่านทดลองงาน', required: false },
  { key: 'contractEndDate', label: 'วันหมดสัญญา', required: false }
]

// Header substrings (case-insensitive, matched after trimming). First hit wins.
const HEADER_ALIASES: Record<string, string[]> = {
  employeeCode: ['รหัสพนักงาน', 'รหัสพนง', 'employee code', 'emp code', 'employee id'],
  prefix: ['คำนำหน้า'],
  hireStatus: ['สถานะการจ้าง', 'ระดับพนักงาน', 'ประเภทการจ้าง', 'ประเภทพนักงาน'],
  startDate: ['วันที่เริ่มทำงาน', 'วันที่เริ่มงาน', 'วันเริ่มงาน', 'เริ่มงาน', 'start date', 'วันเริ่มทำงาน'],
  department: ['แผนก', 'department'],
  position: ['ตำแหน่ง', 'position'],
  phone: ['โทรศัพท์', 'เบอร์โทร', 'เบอร์ติดต่อ', 'มือถือ', 'phone', 'tel'],
  probationDate: ['ผ่านทดลองงาน', 'วันผ่านโปร', 'ครบทดลองงาน'],
  contractEndDate: ['วันหมดสัญญา', 'วันสิ้นสุดสัญญา', 'สิ้นสุดสัญญา', 'หมดสัญญา', 'สิ้นสุดการจ้าง']
}

// Maps each field key to the source column index in the uploaded file.
function detectColumns(headerRow: string[]): Record<string, number> {
  const norm = headerRow.map(h => (h ?? '').toString().trim())
  const map: Record<string, number> = {}

  // Name: HR files often merge "ชื่อ-นามสกุล" across two columns (first name, last name).
  const mergedIdx = norm.findIndex(h => h === 'ชื่อ-นามสกุล' || /^ชื่อ\s*[-–]\s*(นาม)?สกุล$/.test(h))
  if (mergedIdx >= 0) {
    map.firstName = mergedIdx
    map.lastName = mergedIdx + 1
  } else {
    const fn = norm.findIndex(h => h === 'ชื่อ' || (h.includes('ชื่อ') && !h.includes('สกุล')))
    if (fn >= 0) map.firstName = fn
    const ln = norm.findIndex(h => h === 'นามสกุล' || h === 'สกุล' || h.includes('นามสกุล'))
    if (ln >= 0) map.lastName = ln
  }

  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    if (map[key] !== undefined) continue
    const idx = norm.findIndex(h => {
      const low = h.toLowerCase()
      return low !== '' && aliases.some(a => low.includes(a.toLowerCase()))
    })
    if (idx >= 0) map[key] = idx
  }
  return map
}

// --- Client-side CSV parsing (RFC4180-ish: quoted fields, commas/newlines inside quotes) ---
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const src = text.replace(/\r\n/g, '\n')

  for (let i = 0; i < src.length; i++) {
    const char = src[i]
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter(r => r.some(cell => cell.trim() !== ''))
}

interface ParsedRow {
  index: number
  cells: Record<string, string>
  errors: string[]
}

const fileName = ref<string | null>(null)
const fileSize = ref<number>(0)
const isDragging = ref(false)
const parseError = ref<string | null>(null)
const rows = ref<ParsedRow[]>([])

interface ImportResult {
  summary: { total: number; created: number; skipped: number; failed: number }
  created: { row: number; employeeCode: string | null; id: number }[]
  skipped: { row: number; employeeCode: string | null; reason: string }[]
  failed: { row: number; employeeCode: string | null; reason: string }[]
}
const importResult = ref<ImportResult | null>(null)

const hasData = computed(() => rows.value.length > 0)
const validRows = computed(() => rows.value.filter(r => r.errors.length === 0))
const invalidRows = computed(() => rows.value.filter(r => r.errors.length > 0))

const DATE_RE = /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/
const DATE_FIELDS: { key: string; label: string }[] = [
  { key: 'startDate', label: 'วันที่เริ่มงาน' },
  { key: 'probationDate', label: 'วันผ่านทดลองงาน' },
  { key: 'contractEndDate', label: 'วันหมดสัญญา' }
]

// Resolved hireType for a row, from the sheet's "สถานะการจ้าง" cell. '' when it
// can't be read — validateRow turns that into an error.
function rowHireType(cells: Record<string, string>): string {
  return resolveHireType(cells.hireStatus) ?? ''
}

function validateRow(cells: Record<string, string>): string[] {
  const errors: string[] = []
  for (const f of FIELDS) {
    if (f.required && !cells[f.key]?.trim()) errors.push(`ไม่มี "${f.label}"`)
  }
  const hire = cells.hireStatus?.trim()
  if (hire && !resolveHireType(hire)) errors.push(`อ่านสถานะการจ้างไม่ได้: "${hire}"`)
  // Dates come as d/m/yyyy with either พ.ศ. or ค.ศ. years (e.g. "1/7/2024", "7/09/2567").
  for (const d of DATE_FIELDS) {
    const v = cells[d.key]?.trim()
    if (v && !DATE_RE.test(v)) errors.push(`รูปแบบ "${d.label}" ไม่ถูกต้อง (เช่น 1/7/2024)`)
  }
  return errors
}

// Turns a raw grid (header row + data rows) into validated ParsedRow[], mapping
// source columns to FIELDS by matching the header text.
function buildRows(table: string[][]) {
  const grid = table.filter(r => r.some(c => (c ?? '').toString().trim() !== ''))
  if (grid.length < 2) {
    parseError.value = 'ไม่พบข้อมูลในไฟล์ที่เลือก'
    return
  }
  const [headerRow, ...dataRows] = grid
  const colMap = detectColumns(headerRow)

  if (colMap.employeeCode === undefined && colMap.firstName === undefined) {
    parseError.value = 'อ่านหัวตารางไม่ได้ — ไม่พบคอลัมน์ "รหัสพนักงาน" หรือ "ชื่อ" (แถวแรกของไฟล์ต้องเป็นชื่อหัวคอลัมน์)'
    return
  }

  importResult.value = null
  const parsed: ParsedRow[] = []
  for (const cols of dataRows) {
    const cells: Record<string, string> = {}
    for (const f of FIELDS) {
      const idx = colMap[f.key]
      cells[f.key] = idx === undefined ? '' : (cols[idx] ?? '').toString().trim()
    }
    // Skip the sheet's blank / running-number-only trailing rows.
    if (!cells.employeeCode && !cells.firstName && !cells.lastName) continue
    parsed.push({ index: parsed.length + 1, cells, errors: validateRow(cells) })
  }
  rows.value = parsed
}

async function readXlsx(file: File): Promise<string[][]> {
  const mod = await import('xlsx')
  const XLSX: any = (mod as any).default ?? mod
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return []
  // raw:false + dateNF gives us dd/mm/yyyy text for date cells, matching the CSV format.
  const aoa: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    dateNF: 'dd/mm/yyyy',
    defval: ''
  })
  return aoa.map(row => (row ?? []).map(cell => (cell == null ? '' : String(cell))))
}

async function processFile(file: File) {
  parseError.value = null
  fileName.value = file.name
  fileSize.value = file.size
  rows.value = []

  const isExcel = /\.xlsx?$/i.test(file.name)
  try {
    if (isExcel) {
      buildRows(await readXlsx(file))
    } else {
      const text = await file.text()
      buildRows(parseCsv(text))
    }
  } catch {
    parseError.value = 'ไม่สามารถอ่านไฟล์นี้ได้ ตรวจสอบว่าเป็นไฟล์ .csv หรือ .xlsx ที่ถูกต้อง'
  }
}

function onFileInputChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function resetFile() {
  fileName.value = null
  fileSize.value = 0
  parseError.value = null
  rows.value = []
  importResult.value = null
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const isSubmitting = ref(false)
async function startImport() {
  if (validRows.value.length === 0) return
  isSubmitting.value = true
  parseError.value = null
  try {
    const payload = {
      rows: validRows.value.map(r => ({
        employeeCode: r.cells.employeeCode,
        prefix: r.cells.prefix,
        firstName: r.cells.firstName,
        lastName: r.cells.lastName,
        hireType: r.cells.hireStatus,
        startDate: r.cells.startDate,
        department: r.cells.department,
        position: r.cells.position,
        phone: r.cells.phone,
        probationDate: r.cells.probationDate,
        contractEndDate: r.cells.contractEndDate
      }))
    }
    importResult.value = await $fetch<ImportResult>('/api/employees/import', {
      method: 'POST',
      body: payload
    })
  } catch (err: any) {
    parseError.value = err?.data?.statusMessage || err?.statusMessage || 'นำเข้าข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <RequirePermission requiredRole="HR_ADMIN">
    <PageHeader
      title="นำเข้าข้อมูลพนักงานเก่า"
      subtitle="อัปโหลดไฟล์ CSV หรือ Excel เพื่อนำเข้าข้อมูลพนักงานที่มีอยู่แล้วเข้าสู่ระบบ"
      color="indigo"
    >
      <template #icon>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
      </template>
    </PageHeader>

    <!-- Upload area -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <h3 class="text-sm font-bold text-slate-700 mb-4">เลือกไฟล์ (CSV หรือ Excel)</h3>

      <label
        v-if="!fileName"
        class="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-12 px-6 cursor-pointer transition-colors"
        :class="isDragging ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50'"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        <div class="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
        </div>
        <p class="text-sm font-semibold text-slate-700">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</p>
        <p class="text-xs text-slate-400">รองรับไฟล์ .csv และ .xlsx</p>
        <input type="file" accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="sr-only" @change="onFileInputChange">
      </label>

      <div v-else class="flex items-center justify-between gap-4 p-4 border border-emerald-200 bg-emerald-50/50 rounded-xl">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800 truncate">{{ fileName }}</p>
            <p class="text-xs text-slate-500">{{ formatFileSize(fileSize) }} · {{ rows.length }} แถวข้อมูล</p>
          </div>
        </div>
        <button @click="resetFile" class="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          เลือกไฟล์ใหม่
        </button>
      </div>

      <p v-if="parseError" class="mt-3 text-sm text-red-600">{{ parseError }}</p>
    </div>

    <!-- Import result -->
    <div v-if="importResult" class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <div class="min-w-0">
          <p class="text-sm font-bold text-slate-800">นำเข้าข้อมูลเสร็จสิ้น</p>
          <p class="text-sm text-slate-600 mt-0.5">
            เพิ่มใหม่ <span class="font-semibold text-emerald-700">{{ importResult.summary.created }}</span> ·
            ข้าม <span class="font-semibold text-amber-700">{{ importResult.summary.skipped }}</span> ·
            ผิดพลาด <span class="font-semibold text-rose-700">{{ importResult.summary.failed }}</span>
            (ทั้งหมด {{ importResult.summary.total }} แถว)
          </p>
        </div>
      </div>
      <div v-if="importResult.skipped.length || importResult.failed.length" class="mt-4 overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="text-slate-500 text-xs uppercase border-b border-slate-200">
            <tr><th class="px-3 py-2 font-semibold">แถว</th><th class="px-3 py-2 font-semibold">รหัสพนักงาน</th><th class="px-3 py-2 font-semibold">สาเหตุ</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="s in importResult.skipped" :key="`s-${s.row}`">
              <td class="px-3 py-2 text-slate-400">{{ s.row }}</td>
              <td class="px-3 py-2 text-slate-700 whitespace-nowrap">{{ s.employeeCode || '—' }}</td>
              <td class="px-3 py-2"><span class="text-amber-700">ข้าม:</span> {{ s.reason }}</td>
            </tr>
            <tr v-for="f in importResult.failed" :key="`f-${f.row}`">
              <td class="px-3 py-2 text-slate-400">{{ f.row }}</td>
              <td class="px-3 py-2 text-slate-700 whitespace-nowrap">{{ f.employeeCode || '—' }}</td>
              <td class="px-3 py-2"><span class="text-rose-700">ผิดพลาด:</span> {{ f.reason }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-4 flex justify-end">
        <button @click="resetFile" class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700 transition-colors">
          นำเข้าไฟล์ใหม่
        </button>
      </div>
    </div>

    <!-- Preview & validation -->
    <div v-if="hasData && !importResult" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="แถวข้อมูลทั้งหมด" :value="rows.length" color="indigo">
          <template #icon>
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2a4 4 0 014-4h3m-3-4l4 4-4 4M5 6h.01M5 12h.01M5 18h.01"></path></svg>
          </template>
        </StatCard>
        <StatCard label="พร้อมนำเข้า" :value="validRows.length" color="green">
          <template #icon>
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          </template>
        </StatCard>
        <StatCard label="มีข้อผิดพลาด" :value="invalidRows.length" color="rose">
          <template #icon>
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 4.5c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"></path></svg>
          </template>
        </StatCard>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div class="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-700">ตัวอย่างข้อมูลที่จะนำเข้า</h3>
          <span class="text-xs text-slate-400">แสดงสูงสุด 50 แถวแรก</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-xs">
              <tr>
                <th class="px-4 py-3 font-semibold">#</th>
                <th v-for="f in FIELDS" :key="f.key" class="px-4 py-3 font-semibold whitespace-nowrap">{{ f.label }}</th>
                <th class="px-4 py-3 font-semibold whitespace-nowrap">ประเภทที่อ่านได้</th>
                <th class="px-4 py-3 font-semibold">สถานะ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="r in rows.slice(0, 50)" :key="r.index" :class="r.errors.length ? 'bg-rose-50/40' : ''">
                <td class="px-4 py-3 text-slate-400">{{ r.index }}</td>
                <td v-for="f in FIELDS" :key="f.key" class="px-4 py-3 text-slate-700 whitespace-nowrap">{{ r.cells[f.key] || '—' }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-slate-700">{{ hireTypeLabel(rowHireType(r.cells)) || '—' }}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span v-if="r.errors.length === 0" class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">พร้อมนำเข้า</span>
                  <span v-else class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700" :title="r.errors.join(', ')">{{ r.errors.length }} ข้อผิดพลาด</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="parseError" class="text-right text-sm text-red-600">{{ parseError }}</p>

      <div class="flex items-center justify-end gap-3">
        <button @click="resetFile" class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700 transition-colors">
          ยกเลิก
        </button>
        <button
          @click="startImport"
          :disabled="isSubmitting || invalidRows.length > 0 || validRows.length === 0"
          class="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isSubmitting ? 'กำลังนำเข้า...' : `นำเข้าข้อมูล ${validRows.length} รายการ` }}
        </button>
      </div>
    </div>

    <div v-else-if="!fileName" class="bg-white rounded-2xl shadow-sm border border-slate-200">
      <EmptyState message="ยังไม่ได้เลือกไฟล์ — เลือกไฟล์ CSV หรือ Excel ด้านบนเพื่อดูตัวอย่างข้อมูล" />
    </div>
  </RequirePermission>
</template>
