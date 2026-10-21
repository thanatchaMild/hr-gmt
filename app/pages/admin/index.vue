<script setup lang="ts">
definePageMeta({ layout: 'admin', title: 'แดชบอร์ด' })

import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const isIT = computed(() => authStore.isITAdmin)
const isHR = computed(() => authStore.isHRAdmin)

// ===== Data (each block only loads for the role that sees it) =====
const { data: applicationsData } = await useFetch<{ employees: any[] }>('/api/employees', {
  query: { status: 'SUBMITTED' },
  immediate: authStore.isHRAdmin,
})
const { data: itRequestsData } = await useFetch<{ requests: any[] }>('/api/it-requests', {
  query: { status: 'PENDING' },
})
const { data: alertsData } = await useFetch<{ alerts: any[] }>('/api/alerts', {
  immediate: authStore.isHRAdmin,
})
const { data: assetSummary } = await useFetch<any>('/api/appsheet-assets/summary', {
  immediate: authStore.isITAdmin,
})
// myapp DB may be unreachable — the card then shows "—" instead of failing the dashboard.
const { data: myappQueue } = await useFetch<any>('/api/asset-requests', {
  query: { queue: '1' },
  immediate: authStore.isITAdmin,
})

const applications = computed(() => applicationsData.value?.employees || [])
const itRequests = computed(() => itRequestsData.value?.requests || [])
const alerts = computed(() => alertsData.value?.alerts || [])

const attentionCount = computed(() =>
  (assetSummary.value?.byStatus || [])
    .filter((s: any) => ['ชำรุด', 'ซ่อมบำรุง', 'สูญหาย'].includes(s.StatusName))
    .reduce((sum: number, s: any) => sum + s.n, 0))
const myappWaiting = computed(() =>
  myappQueue.value ? (myappQueue.value.counts.byStatus['รอ IT ตรวจสอบ'] || 0) : null)

// ===== Header =====
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'สวัสดีตอนเช้า'
  if (hour < 17) return 'สวัสดีตอนบ่าย'
  return 'สวัสดีตอนเย็น'
})
const today = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

// ===== KPI cards =====
interface Kpi { label: string; value: number | string; hint: string; to: string; tone: keyof typeof TONES; icon: string }
const TONES = {
  violet: { card: 'from-violet-50 border-violet-100', icon: 'from-violet-500 to-purple-600 shadow-violet-500/30', value: 'text-violet-700' },
  blue: { card: 'from-sky-50 border-sky-100', icon: 'from-sky-500 to-blue-600 shadow-sky-500/30', value: 'text-blue-700' },
  emerald: { card: 'from-emerald-50 border-emerald-100', icon: 'from-emerald-500 to-teal-500 shadow-emerald-500/30', value: 'text-emerald-600' },
  rose: { card: 'from-rose-50 border-rose-100', icon: 'from-rose-500 to-red-500 shadow-rose-500/30', value: 'text-rose-600' },
  amber: { card: 'from-amber-50 border-amber-100', icon: 'from-amber-400 to-orange-500 shadow-amber-500/30', value: 'text-amber-600' },
}
const ICON = {
  doc: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  inbox: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  alert: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  laptop: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  box: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  chart: 'M4 19V9m6 10V5m6 14v-7m4 7H2',
  swap: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  link: 'M13.828 10.172a4 4 0 010 5.656l-4 4a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l4-4a4 4 0 015.656 5.656l-1.5 1.5',
  upload: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
}

const kpis = computed<Kpi[]>(() => isIT.value
  ? [
      { label: 'คำขอจาก HR รอดำเนินการ', value: itRequests.value.length, hint: 'Onboarding / Offboarding / ทรัพย์สิน', to: '/admin/it/requests', tone: 'violet', icon: ICON.inbox },
      { label: 'คำขอ myapp รอ IT ตรวจสอบ', value: myappWaiting.value ?? '—', hint: myappQueue.value ? `ด่วนมาก ${myappQueue.value.counts.urgentTotal}` : 'ยังเชื่อมต่อ myapp ไม่ได้', to: '/admin/it/asset-requests/queue?status=รอ IT ตรวจสอบ', tone: 'blue', icon: ICON.laptop },
      { label: 'ทรัพย์สินต้องติดตาม', value: assetSummary.value ? attentionCount.value : '—', hint: 'ชำรุด · ซ่อมบำรุง · สูญหาย', to: '/admin/it/assets#attention', tone: 'rose', icon: ICON.alert },
      { label: 'ประกันใกล้หมด (90 วัน)', value: assetSummary.value?.totals.warrantyExpiring ?? '—', hint: assetSummary.value ? `ทรัพย์สินทั้งหมด ${assetSummary.value.totals.total.toLocaleString()} รายการ` : '', to: '/admin/it/assets/list?warranty=expiring', tone: 'amber', icon: ICON.clock },
    ]
  : [
      { label: 'ใบสมัครรอตรวจสอบ', value: applications.value.length, hint: 'ส่งเข้ามาแล้ว ยังไม่อนุมัติ', to: '/admin/hr/applications', tone: 'blue', icon: ICON.doc },
      { label: 'คำขอ IT รอดำเนินการ', value: itRequests.value.length, hint: 'ส่งให้ IT แล้ว ยังไม่เริ่ม', to: '/admin/hr/it-requests', tone: 'violet', icon: ICON.inbox },
      { label: 'ใกล้ครบกำหนด', value: alerts.value.length, hint: 'ทดลองงาน / สัญญา / อายุงาน', to: '/admin/hr/employees', tone: 'rose', icon: ICON.clock },
    ])

// ===== Shortcuts =====
const shortcuts = computed(() => isIT.value
  ? [
      { label: 'จัดการคำขอ', to: '/admin/it/requests', icon: ICON.inbox, tone: 'bg-sky-50 text-sky-600' },
      { label: 'ภาพรวมทรัพย์สิน', to: '/admin/it/assets', icon: ICON.chart, tone: 'bg-emerald-50 text-emerald-600' },
      { label: 'รายการทรัพย์สิน', to: '/admin/it/assets/list', icon: ICON.box, tone: 'bg-teal-50 text-teal-600' },
      { label: 'ประวัติโอนย้าย', to: '/admin/it/assets/transfers', icon: ICON.swap, tone: 'bg-cyan-50 text-cyan-600' },
      { label: 'ขอทรัพย์สินไอที', to: '/admin/it/asset-requests', icon: ICON.laptop, tone: 'bg-violet-50 text-violet-600' },
      { label: 'ข้อมูลพนักงาน', to: '/admin/it/appsheet-employees', icon: ICON.users, tone: 'bg-fuchsia-50 text-fuchsia-600' },
    ]
  : [
      { label: 'ใบสมัครใหม่', to: '/admin/hr/applications', icon: ICON.doc, tone: 'bg-blue-50 text-blue-600' },
      { label: 'ลิงก์สมัครงาน', to: '/admin/hr/onboarding-invites', icon: ICON.link, tone: 'bg-sky-50 text-sky-600' },
      { label: 'ข้อมูลพนักงาน', to: '/admin/hr/employees', icon: ICON.users, tone: 'bg-indigo-50 text-indigo-600' },
      { label: 'นำเข้าพนักงาน', to: '/admin/hr/employees/import', icon: ICON.upload, tone: 'bg-teal-50 text-teal-600' },
      { label: 'คำขออุปกรณ์ IT', to: '/admin/hr/it-requests', icon: ICON.laptop, tone: 'bg-violet-50 text-violet-600' },
    ])

// ===== Lists =====
const REQUEST_TYPE_LABEL: Record<string, string> = { ONBOARDING: 'พนักงานใหม่', OFFBOARDING: 'พนักงานออก', ASSET_REQUEST: 'ขอทรัพย์สิน' }
const REQUEST_TYPE_CLASS: Record<string, string> = {
  ONBOARDING: 'bg-emerald-50 text-emerald-700',
  OFFBOARDING: 'bg-rose-50 text-rose-700',
  ASSET_REQUEST: 'bg-violet-50 text-violet-700',
}
const SEVERITY_CLASS: Record<string, string> = {
  info: 'bg-sky-400', warning: 'bg-amber-400', urgent: 'bg-orange-500', overdue: 'bg-red-500',
}

function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days <= 0) return 'วันนี้'
  if (days === 1) return 'เมื่อวาน'
  if (days < 30) return `${days} วันที่แล้ว`
  return formatThaiDate(dateStr)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome banner -->
    <div
      class="relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8 text-white shadow-lg bg-gradient-to-r"
      :class="isIT ? 'from-violet-600 via-purple-600 to-indigo-600 shadow-purple-500/25' : 'from-blue-600 via-sky-600 to-cyan-500 shadow-blue-500/25'"
    >
      <div class="pointer-events-none absolute -right-12 -top-20 w-72 h-72 rounded-full bg-white/10 blur-2xl"></div>
      <div class="pointer-events-none absolute right-48 -bottom-24 w-56 h-56 rounded-full bg-white/10 blur-2xl"></div>
      <div class="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p class="text-sm text-white/80">{{ greeting }} 👋</p>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mt-1">{{ authStore.user?.name }}</h2>
          <p class="text-sm text-white/70 mt-1">{{ today }}</p>
        </div>
        <span class="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 ring-1 ring-white/25 text-xs font-medium">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
          {{ isIT ? 'ฝ่าย IT' : 'ฝ่ายบุคคล (HR)' }}
        </span>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" :class="kpis.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'">
      <NuxtLink
        v-for="k in kpis"
        :key="k.label"
        :to="k.to"
        class="kpi-card bg-gradient-to-br via-white to-white"
        :class="TONES[k.tone].card"
      >
        <div class="flex items-start justify-between gap-3">
          <span class="text-sm text-slate-500">{{ k.label }}</span>
          <span class="w-9 h-9 rounded-xl bg-gradient-to-br text-white shadow-md flex items-center justify-center flex-shrink-0" :class="TONES[k.tone].icon">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="k.icon" /></svg>
          </span>
        </div>
        <div class="text-3xl font-bold mt-2 tabular-nums" :class="TONES[k.tone].value">{{ typeof k.value === 'number' ? k.value.toLocaleString() : k.value }}</div>
        <div class="text-xs text-slate-400 mt-1">{{ k.hint }}</div>
      </NuxtLink>
    </div>

    <!-- Shortcuts -->
    <div class="ui-card p-5">
      <h3 class="ui-card-title mb-4">เมนูลัด</h3>
      <div class="grid grid-cols-3 gap-3" :class="shortcuts.length === 5 ? 'sm:grid-cols-5' : 'sm:grid-cols-6'">
        <NuxtLink
          v-for="s in shortcuts"
          :key="s.to"
          :to="s.to"
          class="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition text-center"
        >
          <span class="w-11 h-11 rounded-xl flex items-center justify-center transition group-hover:scale-110" :class="s.tone">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" :d="s.icon" /></svg>
          </span>
          <span class="text-xs font-medium text-slate-600 group-hover:text-slate-900 leading-tight">{{ s.label }}</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Work lists -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Pending IT requests (both roles) -->
      <div class="ui-card overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white">
          <h3 class="ui-card-title">{{ isIT ? 'คำขอจาก HR ที่รอดำเนินการ' : 'คำขอ IT ที่รอดำเนินการ' }}</h3>
          <NuxtLink :to="isIT ? '/admin/it/requests' : '/admin/hr/it-requests'" class="text-xs font-medium text-violet-600 hover:text-violet-800">ดูทั้งหมด →</NuxtLink>
        </div>
        <ul class="divide-y divide-slate-100">
          <li v-for="r in itRequests.slice(0, 5)" :key="r.id">
            <NuxtLink :to="isIT ? '/admin/it/requests' : '/admin/hr/it-requests'" class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
              <span class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" :class="paletteFor(r.employeeName).avatar">{{ nameInitial(r.employeeName) }}</span>
              <div class="min-w-0 flex-1">
                <div class="text-sm font-medium text-slate-800 truncate">{{ r.employeeName }}</div>
                <div class="text-xs text-slate-400 truncate">{{ r.department || '—' }} · {{ timeAgo(r.createdAt) }}</div>
              </div>
              <span v-if="r.priority && r.priority !== 'NORMAL'" class="ui-pill bg-red-50 text-red-600">{{ priorityLabel(r.priority) }}</span>
              <span class="ui-pill" :class="REQUEST_TYPE_CLASS[r.type] || 'bg-slate-100 text-slate-600'">{{ REQUEST_TYPE_LABEL[r.type] || r.type }}</span>
            </NuxtLink>
          </li>
          <li v-if="!itRequests.length" class="px-5 py-10 text-center text-sm text-slate-400">ไม่มีคำขอค้าง 🎉</li>
        </ul>
      </div>

      <!-- IT: assets needing attention -->
      <div v-if="isIT" class="ui-card overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white">
          <h3 class="ui-card-title">ทรัพย์สินที่ต้องติดตาม</h3>
          <NuxtLink to="/admin/it/assets#attention" class="text-xs font-medium text-rose-600 hover:text-rose-800">ดูทั้งหมด →</NuxtLink>
        </div>
        <ul class="divide-y divide-slate-100">
          <li v-for="a in (assetSummary?.attention || []).slice(0, 5)" :key="a.AssetID">
            <NuxtLink :to="`/admin/it/assets/${a.AssetID}`" class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
              <span class="ui-pill" :class="paletteFor(a.TypeName).soft">{{ a.TypeName || '—' }}</span>
              <div class="min-w-0 flex-1">
                <div class="ui-code">{{ a.MachineNumber || a.AssetTag }}</div>
                <div class="text-xs text-slate-400 truncate">{{ a.AssignedToName || 'ไม่มีผู้ถือ' }}</div>
              </div>
              <span class="ui-pill" :class="assetStatusClass(a.StatusName)">{{ a.StatusName }}</span>
            </NuxtLink>
          </li>
          <li v-if="!(assetSummary?.attention || []).length" class="px-5 py-10 text-center text-sm text-slate-400">
            {{ assetSummary ? 'ไม่มีทรัพย์สินที่ต้องติดตาม 🎉' : 'ยังโหลดข้อมูลทรัพย์สินไม่ได้' }}
          </li>
        </ul>
      </div>

      <!-- HR: applications waiting -->
      <div v-if="isHR" class="ui-card overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-white">
          <h3 class="ui-card-title">ใบสมัครรอตรวจสอบ</h3>
          <NuxtLink to="/admin/hr/applications" class="text-xs font-medium text-sky-600 hover:text-sky-800">ดูทั้งหมด →</NuxtLink>
        </div>
        <ul class="divide-y divide-slate-100">
          <li v-for="e in applications.slice(0, 5)" :key="e.id">
            <NuxtLink :to="`/admin/hr/applications/${e.id}`" class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
              <span class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" :class="paletteFor(`${e.firstName} ${e.lastName}`).avatar">{{ nameInitial(e.firstName) }}</span>
              <div class="min-w-0 flex-1">
                <div class="text-sm font-medium text-slate-800 truncate">{{ e.firstName }} {{ e.lastName }}</div>
                <div class="text-xs text-slate-400 truncate">{{ [e.department, e.branch].filter(Boolean).join(' · ') || '—' }} · {{ timeAgo(e.createdAt) }}</div>
              </div>
              <span v-if="e.hireType" class="ui-pill bg-sky-50 text-sky-700">{{ hireTypeLabel(e.hireType) }}</span>
            </NuxtLink>
          </li>
          <li v-if="!applications.length" class="px-5 py-10 text-center text-sm text-slate-400">ไม่มีใบสมัครค้าง 🎉</li>
        </ul>
      </div>

      <!-- HR: deadline alerts -->
      <div v-if="isHR" class="ui-card overflow-hidden lg:col-span-2">
        <div class="flex items-center justify-between px-5 py-4 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white">
          <h3 class="ui-card-title">ใกล้ครบกำหนด</h3>
          <NuxtLink to="/admin/hr/employees" class="text-xs font-medium text-rose-600 hover:text-rose-800">ดูพนักงาน →</NuxtLink>
        </div>
        <ul class="divide-y divide-slate-100">
          <li v-for="a in alerts.slice(0, 6)" :key="a.id">
            <NuxtLink :to="`/admin/hr/employees/${a.employeeId}`" class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :class="SEVERITY_CLASS[a.severity] || 'bg-slate-300'"></span>
              <span class="text-sm text-slate-700">{{ a.message }}</span>
            </NuxtLink>
          </li>
          <li v-if="!alerts.length" class="px-5 py-10 text-center text-sm text-slate-400">ไม่มีรายการใกล้ครบกำหนด</li>
        </ul>
      </div>
    </div>
  </div>
</template>
