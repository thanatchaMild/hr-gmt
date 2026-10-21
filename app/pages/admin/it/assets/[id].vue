<script setup lang="ts">
definePageMeta({ layout: 'admin', section: 'ทรัพย์สิน', title: 'รายละเอียดทรัพย์สิน' })

import RequirePermission from '~/components/admin/RequirePermission.vue'

interface TimelineItem {
  key: string
  date: string | null
  kind: 'created' | 'transfer' | 'transaction'
  title: string
  from?: string | null
  to?: string | null
  note?: string | null
  by?: string | null
}

const route = useRoute()
const router = useRouter()
// Forwards the session cookie during SSR (plain $fetch would hit the API unauthenticated).
const requestFetch = useRequestFetch()
const { data, status, error, refresh: fetchDetail } = await useAsyncData(
  () => `it-asset-${route.params.id}`,
  () => requestFetch<any>(`/api/appsheet-assets/${route.params.id}`),
)
const loading = computed(() => status.value === 'pending')
const errorMsg = computed(() => error.value ? (error.value.data?.statusMessage || error.value.message || 'ไม่สามารถโหลดข้อมูลได้') : '')
const asset = computed(() => data.value?.asset ?? null)
const licenses = computed<any[]>(() => data.value?.licenses || [])
const transfers = computed<any[]>(() => data.value?.transfers || [])
const transactions = computed<any[]>(() => data.value?.transactions || [])
// null = myapp DB unreachable / not migrated yet
const relatedRequests = computed<any[] | null>(() => data.value ? data.value.relatedRequests : [])

function place(employee: string | null, branch: string | null, location?: string | null) {
  const where = [branch, location].filter(Boolean).join(' / ')
  if (employee && where) return `${employee} (${where})`
  return employee || where || null
}

// Transfers + generic transactions as one newest-first history.
const timeline = computed<TimelineItem[]>(() => {
  const items: TimelineItem[] = transfers.value.map(tr => {
    const isInitial = tr.Note === INITIAL_TRANSFER_NOTE
    return {
      key: `tr-${tr.TransferID}`,
      date: tr.TransferDate,
      kind: isInitial ? 'created' : 'transfer',
      title: isInitial ? 'ลงทะเบียนทรัพย์สิน' : 'โอนย้าย',
      from: isInitial ? null : place(tr.FromEmployeeName || tr.PrevEmployeeName, tr.FromBranchName || tr.PrevBranchName),
      to: place(tr.ToEmployeeName, tr.ToBranchName, tr.ToLocationName),
      note: isInitial ? null : tr.Note,
      by: tr.CreatedBy,
    }
  })
  for (const tx of transactions.value) {
    items.push({
      key: `tx-${tx.TransactionID}`,
      date: tx.TransactionDate,
      kind: 'transaction',
      title: tx.TransactionType || 'บันทึกเหตุการณ์',
      to: tx.EmployeeName,
      note: tx.Remarks,
    })
  }
  return items.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
})

const documents = computed(() => {
  if (!asset.value) return []
  return [
    { label: 'เอกสารจัดซื้อ', url: asset.value.DocumentPurchaseDriveLink },
    { label: 'MEMO', url: asset.value.DocumentMemoDriveLink },
    { label: 'เอกสารงบประมาณ', url: asset.value.DocumentBudgetDriveLink },
  ].filter(d => d.url)
})

const warranty = computed(() => warrantyBadge(asset.value?.WarrantyEndDate))

// Back to whichever page opened this one (list, overview, transfers); the list when opened directly.
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/admin/it/assets/list')
}
</script>

<template>
  <RequirePermission requiredRole="IT_ADMIN">
    <!-- Header -->
    <div class="relative overflow-hidden flex items-start gap-4 mb-6 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-5 py-5 sm:px-7 text-white shadow-lg shadow-purple-500/25">
      <div class="pointer-events-none absolute -right-10 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl"></div>
      <button @click="goBack" class="relative w-9 h-9 rounded-lg bg-white/15 ring-1 ring-white/25 hover:bg-white/25 flex items-center justify-center flex-shrink-0" aria-label="ย้อนกลับ">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div class="relative min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-xl sm:text-2xl font-bold font-mono tracking-tight">
            {{ asset ? (asset.MachineNumber || `#${asset.AssetID}`) : errorMsg ? 'ทรัพย์สิน' : 'กำลังโหลด...' }}
          </h2>
          <span v-if="asset?.StatusName" class="ui-pill" :class="assetStatusClass(asset.StatusName)">{{ asset.StatusName }}</span>
          <span v-if="warranty" class="ui-pill" :class="warranty.cls">{{ warranty.label }}</span>
        </div>
        <p class="text-sm text-white/75 mt-1 truncate">{{ [asset?.TypeName, asset?.Brand, asset?.AssetName].filter(Boolean).join(' · ') }}</p>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-7 h-7 border-[3px] border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
    </div>

    <div v-else-if="errorMsg" class="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
      {{ errorMsg }}
      <button @click="() => fetchDetail()" class="ml-3 underline hover:no-underline">ลองใหม่</button>
    </div>

    <div v-else-if="asset" class="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      <div class="xl:col-span-2 space-y-6">
        <!-- Asset info -->
        <section class="ui-card p-6">
          <h3 class="ui-card-title mb-5">ข้อมูลทรัพย์สิน</h3>
          <dl class="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
            <div><dt class="ui-label">รหัสเครื่อง</dt><dd class="ui-value font-mono">{{ asset.MachineNumber || '—' }}</dd></div>
            <div><dt class="ui-label">ประเภท</dt><dd class="ui-value">{{ asset.TypeName || '—' }}</dd></div>
            <div><dt class="ui-label">ยี่ห้อ</dt><dd class="ui-value">{{ asset.Brand || '—' }}</dd></div>
            <div class="col-span-2 md:col-span-3"><dt class="ui-label">Asset Tag</dt><dd class="ui-value font-mono text-[13px] text-slate-600">{{ asset.AssetTag || '—' }}</dd></div>
            <div class="col-span-2 md:col-span-3"><dt class="ui-label">ชื่อ / รายละเอียด</dt><dd class="ui-value">{{ asset.AssetName || '—' }}</dd></div>
            <div><dt class="ui-label">วันที่ซื้อ</dt><dd class="ui-value">{{ formatThaiDate(asset.PurchaseDate) }}</dd></div>
            <div><dt class="ui-label">หมดประกัน</dt><dd class="ui-value">{{ formatThaiDate(asset.WarrantyEndDate) }}</dd></div>
            <div><dt class="ui-label">ราคา</dt><dd class="ui-value">{{ formatBaht(asset.Price) }}</dd></div>
            <div><dt class="ui-label">Vendor</dt><dd class="ui-value">{{ asset.Vendor || '—' }}</dd></div>
            <div><dt class="ui-label">PR Number</dt><dd class="ui-value">{{ asset.PRNumber || '—' }}</dd></div>
          </dl>
          <div v-if="asset.Notes" class="mt-5 pt-5 border-t border-slate-100">
            <div class="ui-label">หมายเหตุ</div>
            <p class="ui-value whitespace-pre-line">{{ asset.Notes }}</p>
          </div>
        </section>

        <!-- Timeline -->
        <section class="ui-card p-6">
          <div class="flex items-center justify-between mb-5">
            <h3 class="ui-card-title">ประวัติการเคลื่อนไหว</h3>
            <span class="text-xs text-slate-400">{{ timeline.length }} รายการ</span>
          </div>
          <ol v-if="timeline.length" class="relative space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
            <li v-for="item in timeline" :key="item.key" class="relative pl-7">
              <span
                class="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full ring-4 ring-white"
                :class="item.kind === 'transfer' ? 'bg-purple-500' : item.kind === 'created' ? 'bg-slate-300' : 'bg-orange-400'"
              ></span>
              <div class="flex flex-wrap items-baseline justify-between gap-x-3">
                <span class="text-sm font-semibold text-slate-800">{{ item.title }}</span>
                <span class="text-xs text-slate-400">{{ formatThaiDate(item.date) }}</span>
              </div>
              <div class="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
                <template v-if="item.from">
                  <span>{{ item.from }}</span>
                  <svg class="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </template>
                <span :class="{ 'font-medium text-slate-800': item.from }">{{ item.to || '—' }}</span>
              </div>
              <p v-if="item.note" class="mt-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{{ item.note }}</p>
            </li>
          </ol>
          <p v-else class="text-sm text-slate-400">ยังไม่มีประวัติ</p>
          <p class="text-[11px] text-slate-400 mt-5">ชื่อ "จาก" ที่ระบบเก่าไม่ได้บันทึก จะอนุมานจากผู้รับในรายการก่อนหน้า</p>
        </section>

        <!-- Licenses -->
        <section v-if="licenses.length" class="ui-card overflow-hidden">
          <h3 class="ui-card-title px-6 pt-5 pb-3">ลิขสิทธิ์ซอฟต์แวร์ ({{ licenses.length }})</h3>
          <div class="overflow-x-auto">
            <table class="ui-table">
              <thead><tr><th>ชื่อลิขสิทธิ์</th><th>License Key</th><th>Vendor</th><th>วันหมดอายุ</th></tr></thead>
              <tbody>
                <tr v-for="lic in licenses" :key="lic.LicenseID">
                  <td class="font-medium text-slate-800">{{ lic.LicenseName }}</td>
                  <td class="font-mono text-xs text-slate-600">{{ lic.LicenseKey || '—' }}</td>
                  <td class="text-slate-600">{{ lic.Vendor || '—' }}</td>
                  <td class="text-slate-500 whitespace-nowrap">{{ formatThaiDate(lic.ExpireDate) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside class="space-y-6">
        <!-- Holder -->
        <section class="ui-card p-6">
          <h3 class="ui-card-title mb-4">ผู้ถือครองปัจจุบัน</h3>
          <div v-if="asset.AssignedToName" class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0" :class="paletteFor(asset.AssignedToName).avatar">{{ nameInitial(asset.AssignedToName) }}</div>
            <div class="min-w-0">
              <div class="font-semibold text-slate-800">{{ asset.AssignedToName }}<span v-if="asset.Nickname" class="font-normal text-slate-400"> ({{ asset.Nickname }})</span></div>
              <div class="text-sm text-slate-500">{{ [asset.PositionTitle, asset.DepartmentName].filter(Boolean).join(' · ') || '—' }}</div>
              <div v-if="asset.EmployeeEmail" class="text-xs text-slate-400 mt-0.5 break-all">{{ asset.EmployeeEmail }}</div>
            </div>
          </div>
          <p v-else class="text-sm text-slate-400">ไม่มีผู้ถือครอง</p>
          <dl class="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-100">
            <div><dt class="ui-label">สาขา</dt><dd class="ui-value">{{ asset.BranchName || '—' }}</dd></div>
            <div><dt class="ui-label">ที่จัดเก็บ</dt><dd class="ui-value">{{ asset.LocationName || '—' }}</dd></div>
          </dl>
          <NuxtLink
            v-if="asset.AssignedToName"
            :to="{ path: '/admin/it/assets/list', query: { search: asset.AssignedToName } }"
            class="ui-btn-outline w-full mt-5"
          >ดูทรัพย์สินทั้งหมดของคนนี้</NuxtLink>
        </section>

        <!-- Documents -->
        <section class="ui-card p-6">
          <h3 class="ui-card-title mb-3">เอกสาร</h3>
          <ul v-if="documents.length" class="space-y-1">
            <li v-for="d in documents" :key="d.label">
              <a :href="d.url" target="_blank" rel="noopener" class="flex items-center justify-between px-3 py-2 -mx-3 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
                {{ d.label }}
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </li>
          </ul>
          <p v-else class="text-sm text-slate-400">ไม่มีลิงก์เอกสาร</p>
        </section>

        <!-- Related myapp requests -->
        <section class="ui-card p-6">
          <h3 class="ui-card-title mb-3">คำขอที่เกี่ยวข้อง (myapp)</h3>
          <p v-if="relatedRequests === null" class="text-sm text-slate-400">ยังดึงข้อมูลจาก myapp ไม่ได้ (ฐานข้อมูลยังไม่ได้ตั้งค่า หรือยังไม่อัปเดต)</p>
          <ul v-else-if="relatedRequests.length" class="space-y-1">
            <li v-for="r in relatedRequests" :key="`${r.id}-${r.item_name}`">
              <NuxtLink :to="`/admin/it/asset-requests/${r.id}`" class="block px-3 py-2 -mx-3 rounded-lg hover:bg-slate-50">
                <div class="flex items-center justify-between gap-2">
                  <span class="ui-code">{{ r.doc_no || `#${r.id}` }}</span>
                  <span class="ui-pill" :class="requestStatusClass(r.status)">{{ r.status }}</span>
                </div>
                <div class="text-xs text-slate-500 mt-0.5">{{ r.item_name }} · {{ formatThaiDate(r.created_at) }}</div>
              </NuxtLink>
            </li>
          </ul>
          <p v-else class="text-sm text-slate-400">ไม่มีคำขอที่ผูกกับทรัพย์สินนี้</p>
        </section>
      </aside>
    </div>
  </RequirePermission>
</template>
