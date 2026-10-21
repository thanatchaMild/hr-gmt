<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
import RequirePermission from '~/components/admin/RequirePermission.vue'
import AppPagination from '~/components/admin/AppPagination.vue'
import PageHeader from '~/components/admin/PageHeader.vue'
import StatusBadge from '~/components/admin/StatusBadge.vue'
import EmptyState from '~/components/admin/EmptyState.vue'
import ITRequestDetailModal from '~/components/admin/ITRequestDetailModal.vue'
import AssetAssignModal from '~/components/admin/AssetAssignModal.vue'
import AssetReturnModal from '~/components/admin/AssetReturnModal.vue'
import { formatRequestedItems, priorityLabel, priorityBadgeColor, PRIORITIES, type RequestedItem } from '~/utils/itRequest'

// ==================== Tab 1: Internal Requests ====================
interface ITRequestRow {
  id: string
  employeeName: string
  status: string
  type: string
  requestedItems: Array<string | RequestedItem>
  attachments?: { name: string; url: string }[]
  requestType: string | null
  department: string | null
  approver: string | null
  notes: string | null
  requestedBy: string | null
  requestFor?: string
  requesterName?: string | null
  requesterEmployeeCode?: string | null
  contactEmail?: string | null
  priority?: string
  neededDate?: string | null
  returnDate?: string | null
  createdAt: string
}

const { data, refresh } = await useFetch<{ requests: ITRequestRow[] }>('/api/it-requests')
const requests = computed(() => data.value?.requests || [])

const searchQuery = ref('')
const filterStatus = ref('')
const filterType = ref('')
const filterPriority = ref('')
const selectedRequest = ref<ITRequestRow | null>(null)
const assignRequest = ref<ITRequestRow | null>(null)
const returnRequest = ref<ITRequestRow | null>(null)

const typeLabel: Record<string, string> = {
  ONBOARDING: 'Onboarding',
  OFFBOARDING: 'Offboarding',
  ASSET_REQUEST: 'คำขอทรัพย์สิน'
}

const statusLabel: Record<string, { text: string; color: 'yellow' | 'blue' | 'green' }> = {
  PENDING: { text: 'รอดำเนินการ', color: 'yellow' },
  IN_PROGRESS: { text: 'กำลังดำเนินการ', color: 'blue' },
  COMPLETED: { text: 'เสร็จสิ้น', color: 'green' }
}

const filteredRequests = computed(() => {
  let result = requests.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(r =>
      r.employeeName.toLowerCase().includes(q) ||
      (r.department || '').toLowerCase().includes(q) ||
      (r.requesterEmployeeCode || '').toLowerCase().includes(q)
    )
  }
  if (filterStatus.value) result = result.filter(r => r.status === filterStatus.value)
  if (filterType.value) result = result.filter(r => r.type === filterType.value)
  if (filterPriority.value) result = result.filter(r => r.priority === filterPriority.value)
  return result
})

const currentPage = ref(1)
watch([searchQuery, filterStatus, filterType, filterPriority], () => { currentPage.value = 1 })
const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredRequests.value.slice(start, start + 10)
})

const actionText = (req: ITRequestRow) => {
  if (req.status === 'COMPLETED') return null
  if (req.type === 'OFFBOARDING') return 'บันทึกคืนอุปกรณ์'
  return req.status === 'PENDING' ? 'เริ่มดำเนินการ' : 'เสร็จสิ้น'
}

const completingId = ref<string | null>(null)

const onActionClick = async (req: ITRequestRow) => {
  if (req.type === 'OFFBOARDING') {
    returnRequest.value = req
  } else if (req.status === 'PENDING') {
    assignRequest.value = req
  } else if (req.status === 'IN_PROGRESS') {
    completingId.value = req.id
    try {
      await $fetch(`/api/it-requests/${req.id}`, {
        method: 'PATCH',
        body: { status: 'COMPLETED' }
      })
      await refresh()
    } catch {
      alert('อัปเดตสถานะไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      completingId.value = null
    }
  }
}

const fmtDate = (d?: string | null) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <RequirePermission requiredRole="IT_ADMIN">
    <PageHeader title="จัดการคำขออุปกรณ์ IT" subtitle="ตรวจสอบและดำเนินการคำขอเบิกอุปกรณ์และสิทธิ์เข้าใช้งาน" color="purple" hero>
      <template #icon>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
      </template>
    </PageHeader>

    <!-- ==================== Tab 1: Internal Requests ==================== -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div class="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/60 rounded-t-2xl">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหาชื่อ, แผนก, รหัสพนักงาน..."
            class="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
          />
          <select v-model="filterStatus" class="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30">
            <option value="">ทุกสถานะ</option>
            <option value="PENDING">รอดำเนินการ</option>
            <option value="IN_PROGRESS">กำลังดำเนินการ</option>
            <option value="COMPLETED">เสร็จสิ้น</option>
          </select>
          <select v-model="filterType" class="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30">
            <option value="">ทุกประเภท</option>
            <option value="ONBOARDING">Onboarding</option>
            <option value="OFFBOARDING">Offboarding</option>
            <option value="ASSET_REQUEST">คำขอทรัพย์สิน</option>
          </select>
          <select v-model="filterPriority" class="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30">
            <option value="">ทุกความเร่งด่วน</option>
            <option v-for="p in PRIORITIES" :key="p.code" :value="p.code">{{ p.label }}</option>
          </select>
        </div>
      </div>

      <div class="h-1 bg-gradient-to-r from-purple-500 via-violet-400 to-indigo-600"></div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-xs">
            <tr>
              <th class="px-4 py-3 font-semibold">ผู้ขอ</th>
              <th class="px-4 py-3 font-semibold">แผนก</th>
              <th class="px-4 py-3 font-semibold">ประเภท</th>
              <th class="px-4 py-3 font-semibold">รายการที่ขอ</th>
              <th class="px-4 py-3 font-semibold">ความเร่งด่วน</th>
              <th class="px-4 py-3 font-semibold">สถานะ</th>
              <th class="px-4 py-3 font-semibold">วันที่ต้องการ</th>
              <th class="px-4 py-3 font-semibold">วันที่ขอ</th>
              <th class="px-4 py-3 font-semibold text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="req in paginatedRequests"
              :key="req.id"
              class="transition-colors"
              :class="req.type === 'OFFBOARDING' ? 'bg-red-50/30 hover:bg-red-50' : 'hover:bg-purple-50/30'"
            >
              <td class="px-4 py-3">
                <p class="font-medium text-slate-900">{{ req.requesterName || req.employeeName }}</p>
                <p v-if="req.requesterEmployeeCode" class="text-xs text-slate-400">{{ req.requesterEmployeeCode }}</p>
              </td>
              <td class="px-4 py-3 text-slate-600 whitespace-nowrap">{{ req.department || '-' }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-semibold"
                  :class="{
                    'bg-blue-100 text-blue-700': req.type === 'ONBOARDING',
                    'bg-red-100 text-red-700': req.type === 'OFFBOARDING',
                    'bg-purple-100 text-purple-700': req.type === 'ASSET_REQUEST'
                  }"
                >{{ typeLabel[req.type] || req.type }}</span>
              </td>
              <td class="px-4 py-3 text-slate-600 max-w-[200px] truncate" :title="formatRequestedItems(req.requestedItems)">
                {{ formatRequestedItems(req.requestedItems) }}
              </td>
              <td class="px-4 py-3">
                <StatusBadge
                  v-if="req.priority"
                  :text="priorityLabel(req.priority)"
                  :color="priorityBadgeColor(req.priority)"
                />
                <span v-else class="text-xs text-slate-300">-</span>
              </td>
              <td class="px-4 py-3">
                <StatusBadge :text="statusLabel[req.status]?.text || req.status" :color="statusLabel[req.status]?.color || 'yellow'" />
              </td>
              <td class="px-4 py-3 text-slate-500 whitespace-nowrap">{{ fmtDate(req.neededDate) }}</td>
              <td class="px-4 py-3 text-slate-500 whitespace-nowrap">{{ fmtDate(req.createdAt) }}</td>
              <td class="px-4 py-3">
                <div class="flex flex-col items-center gap-1.5 min-w-[120px]">
                  <button
                    @click="selectedRequest = req"
                    class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium hover:bg-slate-100 text-slate-700 text-center"
                  >ดูรายละเอียด</button>
                  <button
                    v-if="actionText(req)"
                    @click="onActionClick(req)"
                    :disabled="completingId === req.id"
                    class="w-full px-3 py-1.5 text-white rounded-lg text-xs font-medium disabled:opacity-50 text-center"
                    :class="req.type === 'OFFBOARDING' ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'"
                  >{{ completingId === req.id ? 'กำลังอัปเดต...' : actionText(req) }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="filteredRequests.length === 0" message="ไม่พบคำขอที่ค้นหา" />
      </div>

      <AppPagination v-model:currentPage="currentPage" :totalItems="filteredRequests.length" :itemsPerPage="10" />
    </div>

    <!-- Modals -->
    <ITRequestDetailModal v-if="selectedRequest" :request="selectedRequest" @close="selectedRequest = null" @status-changed="refresh()" />
    <AssetAssignModal v-if="assignRequest" :request="assignRequest" @close="assignRequest = null" @done="refresh()" />
    <AssetReturnModal v-if="returnRequest" :request="returnRequest" @close="returnRequest = null" @done="refresh()" />
  </RequirePermission>
</template>
