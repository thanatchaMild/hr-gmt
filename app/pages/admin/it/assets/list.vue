<script setup lang="ts">
definePageMeta({ layout: 'admin', section: 'ทรัพย์สิน', title: 'รายการทรัพย์สิน' })

import RequirePermission from '~/components/admin/RequirePermission.vue'
import PageHeader from '~/components/admin/PageHeader.vue'
import AppPagination from '~/components/admin/AppPagination.vue'
import EmptyState from '~/components/admin/EmptyState.vue'
import FilterBar from '~/components/admin/FilterBar.vue'

interface AssetRow {
  AssetID: string
  AssetTag: string
  MachineNumber: string | null
  AssetName: string | null
  Brand: string | null
  TypeName: string | null
  StatusName: string | null
  AssignedToName: string | null
  DepartmentName: string | null
  BranchName: string | null
  LocationName: string | null
  PurchaseDate: string | null
  WarrantyEndDate: string | null
  Price: number | null
}

interface ApiResponse {
  data: AssetRow[]
  meta: { current_page: number; last_page: number; total: number; per_page: number }
  filters: {
    types: { TypeID: number; TypeName: string }[]
    statuses: { StatusID: number; StatusName: string }[]
    branches: { BranchID: number; BranchName: string }[]
    departments: { DepartmentID: number; DepartmentName: string }[]
  }
}

const router = useRouter()
const route = useRoute()
// Forwards the session cookie during SSR (plain $fetch would hit the API unauthenticated).
const requestFetch = useRequestFetch()

// Filters start from the URL so the overview page can deep-link here, e.g. ?status_id=2 or ?warranty=expiring
const q = (key: string) => (typeof route.query[key] === 'string' ? route.query[key] as string : '')
const searchInput = ref(q('search'))
const searchQuery = ref(q('search'))
const filterType = ref(q('type_id'))
const filterStatus = ref(q('status_id'))
const filterBranch = ref(q('branch_id'))
const filterDepartment = ref(q('department_id'))
const filterWarranty = ref(q('warranty'))
const currentPage = ref(1)
const errorMsg = ref('')

// useAsyncData hands the SSR result to the client (no refetch / hydration mismatch) and refetches when the query changes.
const query = computed(() => ({ ...currentParams(), page: String(currentPage.value) }))
const { data: apiData, status, error } = await useAsyncData(
  'it-assets-list',
  () => requestFetch<ApiResponse>('/api/appsheet-assets', { query: query.value }),
  { watch: [query] },
)
const loading = computed(() => status.value === 'pending')
watch(error, (e) => { errorMsg.value = e ? (e.data?.statusMessage || e.message || 'ไม่สามารถโหลดข้อมูลได้') : '' }, { immediate: true })

const assets = computed(() => apiData.value?.data || [])
const meta = computed(() => apiData.value?.meta || { current_page: 1, last_page: 1, total: 0, per_page: 20 })
const filters = computed(() => apiData.value?.filters || { types: [], statuses: [], branches: [], departments: [] })
const hasFilters = computed(() => Object.keys(currentParams()).length > 0)

function currentParams(): Record<string, string> {
  const params: Record<string, string> = {}
  if (searchQuery.value) params.search = searchQuery.value
  if (filterType.value) params.type_id = filterType.value
  if (filterStatus.value) params.status_id = filterStatus.value
  if (filterBranch.value) params.branch_id = filterBranch.value
  if (filterDepartment.value) params.department_id = filterDepartment.value
  if (filterWarranty.value) params.warranty = filterWarranty.value
  return params
}

// Called by FilterBar (debounced while typing, or on Enter); the query watcher does the fetch.
function onSearch() {
  searchQuery.value = searchInput.value
}

function resetFilters() {
  searchInput.value = ''
  searchQuery.value = ''
  filterType.value = ''
  filterStatus.value = ''
  filterBranch.value = ''
  filterDepartment.value = ''
  filterWarranty.value = ''
}

watch([filterType, filterStatus, filterBranch, filterDepartment, filterWarranty, searchQuery], () => {
  // Keep the URL in sync so a filtered view can be bookmarked or shared.
  router.replace({ query: currentParams() })
  currentPage.value = 1
})

function goToDetail(id: string) {
  router.push(`/admin/it/assets/${id}`)
}

const exporting = ref(false)
async function exportExcel() {
  exporting.value = true
  try {
    const res = await $fetch<ApiResponse>('/api/appsheet-assets', { query: { ...currentParams(), all: '1' } })
    const XLSX = await import('xlsx')
    const rows = res.data.map(a => ({
      'รหัสเครื่อง': a.MachineNumber || '',
      'Asset Tag': a.AssetTag,
      'ชื่อ': a.AssetName || '',
      'ยี่ห้อ': a.Brand || '',
      'ประเภท': a.TypeName || '',
      'สถานะ': a.StatusName || '',
      'ผู้ถือครอง': a.AssignedToName || '',
      'แผนก': a.DepartmentName || '',
      'สาขา': a.BranchName || '',
      'ที่จัดเก็บ': a.LocationName || '',
      'วันซื้อ': a.PurchaseDate ? a.PurchaseDate.slice(0, 10) : '',
      'หมดประกัน': a.WarrantyEndDate ? a.WarrantyEndDate.slice(0, 10) : '',
      'ราคา': a.Price ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Assets')
    XLSX.writeFile(wb, `it-assets-${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || 'Export ไม่สำเร็จ'
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <RequirePermission requiredRole="IT_ADMIN">
    <PageHeader title="รายการทรัพย์สิน" subtitle="ทรัพย์สิน IT ทั้งหมดจาก AppSheet" color="purple" hero>
      <template #icon>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
      </template>
      <template #actions>
        <button @click="exportExcel" :disabled="exporting || !meta.total" class="ui-btn-outline">
          <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          {{ exporting ? 'กำลัง Export...' : 'Export Excel' }}
        </button>
      </template>
    </PageHeader>

    <div v-if="errorMsg" class="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-700">
      {{ errorMsg }}
      <button @click="errorMsg = ''" class="ml-auto text-red-400 hover:text-red-600">&times;</button>
    </div>

    <div class="ui-card relative overflow-hidden">
      <FilterBar
        v-model:search="searchInput"
        placeholder="รหัสเครื่อง, Tag, ชื่อ, ผู้ถือ..."
        :active="hasFilters"
        @submit="onSearch"
        @reset="resetFilters"
      >
        <select v-model="filterType" class="ui-select">
          <option value="">ประเภท: ทั้งหมด</option>
          <option v-for="t in filters.types" :key="t.TypeID" :value="String(t.TypeID)">{{ t.TypeName }}</option>
        </select>
        <select v-model="filterStatus" class="ui-select">
          <option value="">สถานะ: ทั้งหมด</option>
          <option v-for="s in filters.statuses" :key="s.StatusID" :value="String(s.StatusID)">{{ s.StatusName }}</option>
          <option value="0">ไม่ระบุสถานะ</option>
        </select>
        <select v-model="filterBranch" class="ui-select">
          <option value="">สาขา: ทั้งหมด</option>
          <option v-for="b in filters.branches" :key="b.BranchID" :value="String(b.BranchID)">{{ b.BranchName }}</option>
        </select>
        <select v-model="filterDepartment" class="ui-select max-w-[11rem]">
          <option value="">แผนก: ทั้งหมด</option>
          <option v-for="d in filters.departments" :key="d.DepartmentID" :value="String(d.DepartmentID)">{{ d.DepartmentName }}</option>
        </select>
        <select v-model="filterWarranty" class="ui-select">
          <option value="">ประกัน: ทั้งหมด</option>
          <option value="expiring">ใกล้หมด (90 วัน)</option>
          <option value="expired">หมดแล้ว</option>
        </select>
        <template #end>
          <span class="text-xs text-slate-400 whitespace-nowrap">{{ meta.total.toLocaleString() }} รายการ</span>
        </template>
      </FilterBar>

      <div v-if="loading" class="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
        <div class="w-7 h-7 border-[3px] border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>

      <div class="overflow-x-auto">
        <table class="ui-table">
          <thead>
            <tr>
              <th>รหัสเครื่อง</th>
              <th>ประเภท</th>
              <th>สถานะ</th>
              <th>ผู้ถือครอง</th>
              <th>สาขา</th>
              <th>หมดประกัน</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="asset in assets" :key="asset.AssetID" class="ui-row-link" @click="goToDetail(asset.AssetID)">
              <td class="max-w-[220px]">
                <div class="ui-code">{{ asset.MachineNumber || '—' }}</div>
                <div class="text-xs text-slate-400 truncate" :title="asset.AssetTag">{{ asset.AssetTag }}</div>
              </td>
              <td class="whitespace-nowrap">
                <span class="ui-pill" :class="paletteFor(asset.TypeName).soft">{{ asset.TypeName || '—' }}</span>
                <div v-if="asset.Brand" class="text-xs text-slate-400 mt-0.5">{{ asset.Brand }}</div>
              </td>
              <td>
                <span v-if="asset.StatusName" class="ui-pill" :class="assetStatusClass(asset.StatusName)">{{ asset.StatusName }}</span>
                <span v-else class="text-slate-300">—</span>
              </td>
              <td class="min-w-[200px]">
                <div v-if="asset.AssignedToName" class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" :class="paletteFor(asset.AssignedToName).avatar">{{ nameInitial(asset.AssignedToName) }}</span>
                  <div class="min-w-0">
                    <div class="text-slate-700">{{ asset.AssignedToName }}</div>
                    <div v-if="asset.DepartmentName" class="text-xs text-slate-400">{{ asset.DepartmentName }}</div>
                  </div>
                </div>
                <span v-else class="text-slate-300">—</span>
              </td>
              <td class="whitespace-nowrap">
                <div class="text-slate-700">{{ asset.BranchName || '—' }}</div>
                <div v-if="asset.LocationName" class="text-xs text-slate-400">{{ asset.LocationName }}</div>
              </td>
              <td class="whitespace-nowrap">
                <div class="text-slate-600">{{ formatThaiDate(asset.WarrantyEndDate) }}</div>
                <span v-if="warrantyBadge(asset.WarrantyEndDate)" class="ui-pill mt-0.5 !text-[11px]" :class="warrantyBadge(asset.WarrantyEndDate)!.cls">{{ warrantyBadge(asset.WarrantyEndDate)!.label }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="!loading && assets.length === 0" message="ไม่พบทรัพย์สินที่ตรงกับตัวกรอง" />
      </div>

      <AppPagination v-model:currentPage="currentPage" :totalItems="meta.total" :itemsPerPage="meta.per_page" />
    </div>
  </RequirePermission>
</template>
