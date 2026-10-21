<script setup lang="ts">
definePageMeta({ layout: 'admin', section: 'ทรัพย์สิน', title: 'ข้อมูลพนักงาน (AppSheet)' })

// IT only: AppSheet's employee list with how many IT assets each person holds (read-only).
import PageHeader from '~/components/admin/PageHeader.vue'
import AppPagination from '~/components/admin/AppPagination.vue'
import EmptyState from '~/components/admin/EmptyState.vue'
import FilterBar from '~/components/admin/FilterBar.vue'
import Modal from '~/components/admin/Modal.vue'
import RequirePermission from '~/components/admin/RequirePermission.vue'

interface EmployeeRow {
  RowID: number
  EmployeeID: number | null
  EmployeeCode: string | null
  PersonNo: string | null
  Title: string | null
  FullName: string | null
  Nickname: string | null
  PositionTitle: string | null
  Email: string | null
  DepartmentName: string | null
  BranchName: string | null
  AccountType: string | null
  Issues: string | null
  AssetCount: number
}

interface ApiResponse {
  source: 'employees' | 'appsheet_employees'
  data: EmployeeRow[]
  meta: { current_page: number; last_page: number; total: number; per_page: number }
  filters: {
    departments: { DepartmentID: number; DepartmentName: string }[]
    branches: { BranchID: number; BranchName: string }[]
    accountTypes: string[]
  }
}

// Forwards the session cookie during SSR (plain $fetch would hit the API unauthenticated).
const requestFetch = useRequestFetch()

const searchInput = ref('')
const searchQuery = ref('')
const filterDepartment = ref('')
const filterBranch = ref('')
const filterAccountType = ref('')
const onlyIssues = ref(false)
const currentPage = ref(1)
const errorMsg = ref('')

// useAsyncData hands the SSR result to the client (no refetch / hydration mismatch) and refetches when the query changes.
const query = computed(() => ({ ...currentParams(), page: String(currentPage.value) }))
const { data: apiData, status, error } = await useAsyncData(
  'appsheet-employees',
  () => requestFetch<ApiResponse>('/api/appsheet-employees', { query: query.value }),
  { watch: [query] },
)
const loading = computed(() => status.value === 'pending')
watch(error, (e) => { errorMsg.value = e ? (e.data?.statusMessage || e.message || 'ไม่สามารถโหลดข้อมูลได้') : '' }, { immediate: true })

const rows = computed(() => apiData.value?.data || [])
const meta = computed(() => apiData.value?.meta || { current_page: 1, last_page: 1, total: 0, per_page: 50 })
const isFullTable = computed(() => apiData.value?.source !== 'appsheet_employees')

function currentParams(): Record<string, string> {
  const params: Record<string, string> = {}
  if (searchQuery.value) params.search = searchQuery.value
  if (filterDepartment.value) params.department_id = filterDepartment.value
  if (filterBranch.value) params.branch_id = filterBranch.value
  if (filterAccountType.value) params.account_type = filterAccountType.value
  if (onlyIssues.value) params.issues = '1'
  return params
}

function onSearch() {
  searchQuery.value = searchInput.value
}

function resetFilters() {
  searchInput.value = ''
  searchQuery.value = ''
  filterDepartment.value = ''
  filterBranch.value = ''
  filterAccountType.value = ''
  onlyIssues.value = false
}

watch([searchQuery, filterDepartment, filterBranch, filterAccountType, onlyIssues], () => { currentPage.value = 1 })
const hasFilters = computed(() => Object.keys(currentParams()).length > 0)

function displayName(e: EmployeeRow) {
  return [e.Title, e.FullName].filter(Boolean).join(' ') || '-'
}

// ===== Assets modal =====
const assetsFor = ref<EmployeeRow | null>(null)
const assets = ref<any[]>([])
const assetsLoading = ref(false)

async function openAssets(e: EmployeeRow) {
  if (!e.EmployeeID) return
  assetsFor.value = e
  assets.value = []
  assetsLoading.value = true
  try {
    const res = await $fetch<{ assets: any[] }>(`/api/appsheet-employees/${e.EmployeeID}/assets`)
    assets.value = res.assets
  } catch {
    assets.value = []
  } finally {
    assetsLoading.value = false
  }
}

// ===== Export =====
const exporting = ref(false)
async function exportExcel() {
  exporting.value = true
  try {
    const res = await $fetch<ApiResponse>('/api/appsheet-employees', { query: { ...currentParams(), all: '1' } })
    const XLSX = await import('xlsx')
    const sheetRows = res.data.map(e => ({
      'EmployeeID': e.EmployeeID ?? '',
      'รหัสพนักงาน': e.EmployeeCode || '',
      'ชื่อ-สกุล': displayName(e),
      'ชื่อเล่น': e.Nickname || '',
      'ตำแหน่ง': e.PositionTitle || '',
      'อีเมล': e.Email || '',
      'แผนก': e.DepartmentName || '',
      'สาขา': e.BranchName || '',
      'ประเภทบัญชี': e.AccountType || '',
      'ปัญหา': e.Issues || '',
      'จำนวนทรัพย์สิน': e.AssetCount,
    }))
    const ws = XLSX.utils.json_to_sheet(sheetRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Employees')
    XLSX.writeFile(wb, `appsheet-employees-${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || 'Export ไม่สำเร็จ'
  } finally {
    exporting.value = false
  }
}

</script>

<template>
  <RequirePermission requiredRole="IT_ADMIN">
  <PageHeader title="ข้อมูลพนักงาน (AppSheet)" subtitle="รายชื่อพนักงานในระบบ AppSheet และทรัพย์สิน IT ที่ถือครอง · ดูอย่างเดียว" color="purple" hero>
    <template #icon>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    </template>
    <template #actions>
      <button @click="exportExcel" :disabled="exporting || !meta.total" class="ui-btn-outline">
        <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        {{ exporting ? 'กำลัง Export...' : 'Export Excel' }}
      </button>
    </template>
  </PageHeader>

  <div v-if="apiData && !isFullTable" class="mb-4 flex items-start gap-2.5 px-4 py-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-800">
    <svg class="w-4 h-4 mt-px flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    <span>ฐานข้อมูลนี้ยังไม่มีตาราง <code class="font-semibold">employees</code> ที่ myapp นำเข้าจาก Excel จึงแสดงจาก <code class="font-semibold">appsheet_employees</code> แทน (ไม่มีรหัสพนักงาน / ประเภทบัญชี / ปัญหา)</span>
  </div>

  <div v-if="errorMsg" class="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{{ errorMsg }}</div>

  <div class="ui-card relative overflow-hidden">
    <FilterBar
      v-model:search="searchInput"
      placeholder="ชื่อ, ชื่อเล่น, รหัสพนักงาน, อีเมล..."
      :active="hasFilters"
      @submit="onSearch"
      @reset="resetFilters"
    >
      <select v-model="filterDepartment" class="ui-select max-w-[11rem]">
        <option value="">แผนก: ทั้งหมด</option>
        <option v-for="d in apiData?.filters.departments || []" :key="d.DepartmentID" :value="String(d.DepartmentID)">{{ d.DepartmentName }}</option>
      </select>
      <select v-model="filterBranch" class="ui-select">
        <option value="">สาขา: ทั้งหมด</option>
        <option v-for="b in apiData?.filters.branches || []" :key="b.BranchID" :value="String(b.BranchID)">{{ b.BranchName }}</option>
      </select>
      <template v-if="isFullTable">
        <select v-model="filterAccountType" class="ui-select">
          <option value="">ประเภทบัญชี: ทั้งหมด</option>
          <option v-for="t in apiData?.filters.accountTypes || []" :key="t" :value="t">{{ t }}</option>
        </select>
        <label class="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-600 cursor-pointer select-none hover:bg-slate-50">
          <input v-model="onlyIssues" type="checkbox" class="rounded border-slate-300" /> เฉพาะที่มีปัญหา
        </label>
      </template>
      <template #end>
        <span class="text-xs text-slate-400 whitespace-nowrap">{{ meta.total.toLocaleString() }} คน</span>
      </template>
    </FilterBar>

    <div v-if="loading" class="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
      <div class="w-7 h-7 border-[3px] border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
    </div>

    <div class="overflow-x-auto">
      <table class="ui-table">
        <thead>
          <tr>
            <th>พนักงาน</th>
            <th v-if="isFullTable">รหัสพนักงาน</th>
            <th>ตำแหน่ง</th>
            <th>แผนก / สาขา</th>
            <th>อีเมล</th>
            <th v-if="isFullTable">ประเภทบัญชี</th>
            <th class="!text-right">ทรัพย์สิน</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in rows" :key="e.RowID">
            <td class="min-w-[200px]">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" :class="paletteFor(e.FullName).avatar">{{ nameInitial(e.FullName) }}</div>
                <div class="min-w-0">
                  <div class="text-slate-800 font-medium">{{ displayName(e) }}</div>
                  <div v-if="e.Nickname" class="text-xs text-slate-400">{{ e.Nickname }}</div>
                  <div v-if="e.Issues" class="mt-1 inline-flex items-center gap-1 text-[11px] text-red-600">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                    {{ e.Issues }}
                  </div>
                </div>
              </div>
            </td>
            <td v-if="isFullTable" class="whitespace-nowrap">
              <div class="font-mono text-[13px] text-slate-700">{{ e.EmployeeCode || '—' }}</div>
              <div v-if="e.PersonNo" class="text-[11px] text-slate-400">คนที่ {{ e.PersonNo }}</div>
            </td>
            <td class="text-slate-600">{{ e.PositionTitle || '—' }}</td>
            <td class="min-w-[150px]">
              <div class="text-slate-700">{{ e.DepartmentName || '—' }}</div>
              <div v-if="e.BranchName" class="text-xs text-slate-400">{{ e.BranchName }}</div>
            </td>
            <td class="text-xs text-slate-500 break-all max-w-[14rem]">{{ e.Email || '—' }}</td>
            <td v-if="isFullTable" class="text-xs text-slate-600">{{ e.AccountType || '—' }}</td>
            <td class="text-right">
              <button
                v-if="e.AssetCount"
                @click="openAssets(e)"
                class="ui-pill bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
              >{{ e.AssetCount }} ชิ้น →</button>
              <span v-else class="text-xs text-slate-300">—</span>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!loading && rows.length === 0" message="ไม่พบพนักงาน" />
    </div>

    <AppPagination v-model:currentPage="currentPage" :totalItems="meta.total" :itemsPerPage="meta.per_page" />
  </div>

  <Modal v-if="assetsFor" :title="`ทรัพย์สินของ ${displayName(assetsFor)}`" maxWidth="2xl" @close="assetsFor = null">
    <div v-if="assetsLoading" class="py-10 flex justify-center">
      <div class="w-7 h-7 border-[3px] border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
    </div>
    <p v-else-if="!assets.length" class="py-6 text-center text-sm text-slate-400">ไม่มีทรัพย์สิน</p>
    <ul v-else class="divide-y divide-slate-100 -my-2">
      <li v-for="a in assets" :key="a.AssetID">
        <NuxtLink :to="`/admin/it/assets/${a.AssetID}`" class="flex items-center gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-slate-50">
          <div class="min-w-0 flex-1">
            <div class="ui-code">{{ a.MachineNumber || a.AssetTag }}</div>
            <div class="text-xs text-slate-500 truncate">{{ [a.TypeName, a.Brand, a.AssetName].filter(Boolean).join(' · ') }}</div>
            <div class="text-[11px] text-slate-400">{{ [a.BranchName, a.LocationName].filter(Boolean).join(' · ') }}</div>
          </div>
          <span v-if="a.StatusName" class="ui-pill" :class="assetStatusClass(a.StatusName)">{{ a.StatusName }}</span>
        </NuxtLink>
      </li>
    </ul>
  </Modal>
  </RequirePermission>
</template>
