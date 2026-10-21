<script setup lang="ts">
// Read-only list of myapp IT asset requests. `queue` = myapp's IT queue view (no drafts, urgent counter).
import PageHeader from '~/components/admin/PageHeader.vue'
import AppPagination from '~/components/admin/AppPagination.vue'
import EmptyState from '~/components/admin/EmptyState.vue'
import FilterBar from '~/components/admin/FilterBar.vue'

const props = defineProps<{
  title: string
  subtitle: string
  queue?: boolean
}>()

interface RequestRow {
  id: number
  doc_no: string | null
  request_type: string | null
  department: string | null
  requested_for_name: string | null
  priority: string | null
  status: string
  created_at: string
  creator_name: string | null
  line_count: number
  memo_count: number | null
  memo_confirmed: number | null
}

interface ApiResponse {
  data: RequestRow[]
  meta: { current_page: number; last_page: number; total: number; per_page: number }
  counts: { byStatus: Record<string, number>; urgentTotal: number }
  filters: { departments: { dev_id: number; dev_name: string }[] }
}

const router = useRouter()
const route = useRoute()
// Forwards the session cookie during SSR (plain $fetch would hit the API unauthenticated).
const requestFetch = useRequestFetch()

const q = (key: string) => (typeof route.query[key] === 'string' ? route.query[key] as string : '')
const searchInput = ref(q('search'))
const searchQuery = ref(q('search'))
const filterStatus = ref(q('status'))
const filterType = ref(q('request_type'))
const filterDepartment = ref(q('department_id'))
const dateFrom = ref(q('date_from'))
const dateTo = ref(q('date_to'))
const currentPage = ref(1)

// useAsyncData hands the SSR result to the client (no refetch / hydration mismatch) and refetches when the query changes.
const query = computed(() => ({
  ...currentParams(),
  page: String(currentPage.value),
  ...(props.queue ? { queue: '1' } : {}),
}))
const { data: apiData, status, error } = await useAsyncData(
  props.queue ? 'asset-requests-queue' : 'asset-requests',
  () => requestFetch<ApiResponse>('/api/asset-requests', { query: query.value }),
  { watch: [query] },
)
const loading = computed(() => status.value === 'pending')
const errorMsg = computed(() => error.value ? (error.value.data?.statusMessage || error.value.message || 'ไม่สามารถโหลดข้อมูลจาก myapp ได้') : '')

const rows = computed(() => apiData.value?.data || [])
const meta = computed(() => apiData.value?.meta || { current_page: 1, last_page: 1, total: 0, per_page: 15 })
const byStatus = computed(() => apiData.value?.counts.byStatus || {})
const statusTotal = computed(() => Object.values(byStatus.value).reduce((a, b) => a + b, 0))
const statusOptions = computed(() => ASSET_REQUEST_STATUSES.filter(s => !(props.queue && s === 'draft')))
// Status is a tab above the table, so it doesn't count as a filter for the "ล้างตัวกรอง" link.
const hasFilters = computed(() => !!(searchQuery.value || filterType.value || filterDepartment.value || dateFrom.value || dateTo.value))
function resetToolbar() {
  const status = filterStatus.value
  resetFilters()
  filterStatus.value = status
}

function currentParams(): Record<string, string> {
  const params: Record<string, string> = {}
  if (searchQuery.value) params.search = searchQuery.value
  if (filterStatus.value) params.status = filterStatus.value
  if (filterType.value) params.request_type = filterType.value
  if (filterDepartment.value) params.department_id = filterDepartment.value
  if (dateFrom.value) params.date_from = dateFrom.value
  if (dateTo.value) params.date_to = dateTo.value
  return params
}

function onSearch() {
  searchQuery.value = searchInput.value
}

function resetFilters() {
  searchInput.value = ''
  searchQuery.value = ''
  filterStatus.value = ''
  filterType.value = ''
  filterDepartment.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}

watch([searchQuery, filterStatus, filterType, filterDepartment, dateFrom, dateTo], () => {
  router.replace({ query: currentParams() })
  currentPage.value = 1
})
</script>

<template>
  <PageHeader :title="title" :subtitle="subtitle" color="purple" hero>
    <template #icon>
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    </template>
    <template v-if="queue && apiData" #actions>
      <span class="ui-pill !px-3 !py-1.5 bg-red-50 text-red-700 ring-1 ring-red-200">ด่วนมาก {{ apiData.counts.urgentTotal }}</span>
    </template>
  </PageHeader>

  <div v-if="errorMsg" class="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{{ errorMsg }}</div>

  <div class="ui-card relative overflow-hidden">
    <!-- Status tabs -->
    <div class="flex gap-1 px-3 pt-3 overflow-x-auto border-b border-slate-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        v-for="tab in [{ key: '', label: 'ทั้งหมด', n: statusTotal }, ...statusOptions.map(s => ({ key: s, label: s, n: byStatus[s] || 0 }))]"
        :key="tab.key || 'all'"
        class="relative flex items-center gap-1.5 px-3 pb-2.5 pt-1.5 text-sm whitespace-nowrap transition-colors"
        :class="filterStatus === tab.key ? 'text-purple-700 font-semibold' : 'text-slate-500 hover:text-slate-800'"
        @click="filterStatus = tab.key"
      >
        {{ tab.label }}
        <span
          class="min-w-[1.25rem] px-1.5 rounded-full text-[11px] leading-5 tabular-nums"
          :class="filterStatus === tab.key ? 'bg-purple-100 text-purple-700' : tab.n ? 'bg-slate-100 text-slate-600' : 'text-slate-300'"
        >{{ tab.n }}</span>
        <span v-if="filterStatus === tab.key" class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-purple-600"></span>
      </button>
    </div>

    <FilterBar
      v-model:search="searchInput"
      placeholder="เลขที่คำขอ, แผนก, ผู้ใช้งาน, ผู้สร้าง..."
      :active="hasFilters"
      @submit="onSearch"
      @reset="resetToolbar"
    >
      <select v-model="filterType" class="ui-select max-w-[13rem]">
        <option value="">ประเภทคำขอ: ทั้งหมด</option>
        <option v-for="t in ASSET_REQUEST_TYPES" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="filterDepartment" class="ui-select max-w-[11rem]">
        <option value="">แผนก: ทั้งหมด</option>
        <option v-for="d in apiData?.filters.departments || []" :key="d.dev_id" :value="String(d.dev_id)">{{ d.dev_name }}</option>
      </select>
      <div class="flex items-center gap-1.5">
        <input v-model="dateFrom" type="date" class="ui-input w-[9.5rem]" aria-label="ตั้งแต่วันที่" />
        <span class="text-slate-300">–</span>
        <input v-model="dateTo" type="date" class="ui-input w-[9.5rem]" aria-label="ถึงวันที่" />
      </div>
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
            <th>เลขที่คำขอ</th>
            <th>ประเภทคำขอ</th>
            <th>แผนก / ผู้ใช้งาน</th>
            <th>ผู้สร้าง</th>
            <th class="!text-center">รายการ</th>
            <th>วันที่สร้าง</th>
            <th>สถานะ</th>
            <th>MEMO</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id" class="ui-row-link" @click="router.push(`/admin/it/asset-requests/${r.id}`)">
            <td class="whitespace-nowrap">
              <div class="ui-code">{{ r.doc_no || `#${r.id}` }}</div>
              <span v-if="r.priority && r.priority !== 'ปกติ'" class="ui-pill mt-1 !text-[11px]" :class="priorityClass(r.priority)">{{ r.priority }}</span>
            </td>
            <td class="text-slate-700 max-w-[14rem]">{{ r.request_type || '—' }}</td>
            <td class="min-w-[160px]">
              <div class="text-slate-700">{{ r.department || '—' }}</div>
              <div v-if="r.requested_for_name" class="text-xs text-slate-400">{{ r.requested_for_name }}</div>
            </td>
            <td class="text-slate-600">{{ r.creator_name || '—' }}</td>
            <td class="text-center text-slate-600 tabular-nums">{{ r.line_count }}</td>
            <td class="text-slate-500 whitespace-nowrap">{{ formatThaiDate(r.created_at) }}</td>
            <td><span class="ui-pill" :class="requestStatusClass(r.status)">{{ r.status }}</span></td>
            <td>
              <span v-if="memoStatus(r)" class="ui-pill" :class="memoStatus(r)!.cls">{{ memoStatus(r)!.label }}</span>
              <span v-else class="text-slate-300">—</span>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-if="!loading && rows.length === 0" :message="queue ? 'ไม่มีรายการรอตรวจสอบ' : 'ยังไม่มีคำขอ'" />
    </div>

    <AppPagination v-model:currentPage="currentPage" :totalItems="meta.total" :itemsPerPage="meta.per_page" />
  </div>
</template>
