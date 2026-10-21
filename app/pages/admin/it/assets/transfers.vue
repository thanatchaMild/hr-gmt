<script setup lang="ts">
definePageMeta({ layout: 'admin', section: 'ทรัพย์สิน', title: 'ประวัติโอนย้าย' })

import RequirePermission from '~/components/admin/RequirePermission.vue'
import PageHeader from '~/components/admin/PageHeader.vue'
import AppPagination from '~/components/admin/AppPagination.vue'
import EmptyState from '~/components/admin/EmptyState.vue'
import FilterBar from '~/components/admin/FilterBar.vue'

interface TransferRow {
  TransferID: number
  AssetID: string
  TransferDate: string | null
  Note: string | null
  AssetTag: string | null
  MachineNumber: string | null
  TypeName: string | null
  ToEmployeeName: string | null
  ToBranchName: string | null
  ToLocationName: string | null
  FromName: string | null
  FromBranchName: string | null
}

interface ApiResponse {
  data: TransferRow[]
  meta: { current_page: number; last_page: number; total: number; per_page: number }
  filters: { branches: { BranchID: number; BranchName: string }[] }
}

const router = useRouter()
// Forwards the session cookie during SSR (plain $fetch would hit the API unauthenticated).
const requestFetch = useRequestFetch()

const searchInput = ref('')
const searchQuery = ref('')
const filterBranch = ref('')
const includeInitial = ref(false)
const currentPage = ref(1)

// useAsyncData hands the SSR result to the client (no refetch / hydration mismatch) and refetches when the query changes.
const query = computed(() => {
  const q: Record<string, string> = { page: String(currentPage.value) }
  if (searchQuery.value) q.search = searchQuery.value
  if (filterBranch.value) q.branch_id = filterBranch.value
  if (includeInitial.value) q.include_initial = '1'
  return q
})
const { data: apiData, status, error } = await useAsyncData(
  'it-asset-transfers',
  () => requestFetch<ApiResponse>('/api/appsheet-assets/transfers', { query: query.value }),
  { watch: [query] },
)
const loading = computed(() => status.value === 'pending')
const errorMsg = computed(() => error.value ? (error.value.data?.statusMessage || error.value.message || 'ไม่สามารถโหลดข้อมูลได้') : '')

const rows = computed(() => apiData.value?.data || [])
const meta = computed(() => apiData.value?.meta || { current_page: 1, last_page: 1, total: 0, per_page: 20 })
const branches = computed(() => apiData.value?.filters.branches || [])

function onSearch() {
  searchQuery.value = searchInput.value
}

watch([searchQuery, filterBranch, includeInitial], () => { currentPage.value = 1 })

const hasFilters = computed(() => !!(searchQuery.value || filterBranch.value || includeInitial.value))
function resetFilters() {
  searchInput.value = ''
  searchQuery.value = ''
  filterBranch.value = ''
  includeInitial.value = false
}
</script>

<template>
  <RequirePermission requiredRole="IT_ADMIN">
    <PageHeader title="ประวัติโอนย้าย" subtitle="การส่งต่อทรัพย์สินระหว่างพนักงานและสาขา จาก AppSheet" color="purple" hero>
      <template #icon>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
      </template>
    </PageHeader>

    <div v-if="errorMsg" class="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{{ errorMsg }}</div>

    <div class="ui-card relative overflow-hidden">
      <FilterBar
        v-model:search="searchInput"
        placeholder="รหัสเครื่อง, ชื่อพนักงาน, หมายเหตุ..."
        :active="hasFilters"
        @submit="onSearch"
        @reset="resetFilters"
      >
        <select v-model="filterBranch" class="ui-select">
          <option value="">สาขา: ทั้งหมด</option>
          <option v-for="b in branches" :key="b.BranchID" :value="String(b.BranchID)">{{ b.BranchName }}</option>
        </select>
        <label class="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-600 cursor-pointer select-none hover:bg-slate-50">
          <input v-model="includeInitial" type="checkbox" class="rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
          รวมการลงทะเบียนครั้งแรก
        </label>
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
              <th>วันที่</th>
              <th>ทรัพย์สิน</th>
              <th>จาก</th>
              <th></th>
              <th>ไปยัง</th>
              <th>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.TransferID" class="ui-row-link" @click="router.push(`/admin/it/assets/${r.AssetID}`)">
              <td class="whitespace-nowrap text-slate-500">{{ formatThaiDate(r.TransferDate) }}</td>
              <td class="whitespace-nowrap">
                <div class="ui-code">{{ r.MachineNumber || r.AssetTag || `#${r.AssetID}` }}</div>
                <span class="ui-pill !text-[11px] mt-0.5" :class="paletteFor(r.TypeName).soft">{{ r.TypeName || '—' }}</span>
              </td>
              <td class="min-w-[160px]">
                <div class="text-slate-600">{{ r.FromName || '—' }}</div>
                <div v-if="r.FromBranchName" class="text-xs text-slate-400">{{ r.FromBranchName }}</div>
              </td>
              <td class="!px-0 text-slate-300">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </td>
              <td class="min-w-[180px]">
                <div class="font-medium text-slate-800">{{ r.ToEmployeeName || '—' }}</div>
                <div class="text-xs text-slate-400">{{ [r.ToBranchName, r.ToLocationName].filter(Boolean).join(' · ') }}</div>
              </td>
              <td class="text-xs text-slate-500 max-w-xs">{{ r.Note || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="!loading && rows.length === 0" message="ไม่พบประวัติโอนย้าย" />
      </div>

      <AppPagination v-model:currentPage="currentPage" :totalItems="meta.total" :itemsPerPage="meta.per_page" />
    </div>
    <p class="text-xs text-slate-400 mt-3">ช่อง "จาก" ที่ระบบเก่าไม่ได้บันทึก จะอนุมานจากผู้รับในรายการก่อนหน้าของทรัพย์สินเดียวกัน</p>
  </RequirePermission>
</template>
