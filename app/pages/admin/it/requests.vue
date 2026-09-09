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
import { formatRequestedItems, priorityLabel, priorityBadgeColor, type RequestedItem } from '~/utils/itRequest'

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
const updatingId = ref<string | null>(null)
const selectedRequest = ref<ITRequestRow | null>(null)

const openDetail = (req: ITRequestRow) => {
  selectedRequest.value = req
}

const statusLabel: Record<string, { text: string; color: 'yellow' | 'blue' | 'green' }> = {
  PENDING: { text: 'รอดำเนินการ', color: 'yellow' },
  IN_PROGRESS: { text: 'กำลังดำเนินการ', color: 'blue' },
  COMPLETED: { text: 'ดำเนินการเสร็จสิ้น', color: 'green' }
}

const filteredRequests = computed(() => {
  if (!searchQuery.value) return requests.value
  const q = searchQuery.value.toLowerCase()
  return requests.value.filter(req => req.employeeName.toLowerCase().includes(q))
})

const currentPage = ref(1)
watch(searchQuery, () => { currentPage.value = 1 })
const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredRequests.value.slice(start, start + 10)
})

const cardClass = (req: ITRequestRow) => {
  if (req.type === 'OFFBOARDING') return 'border-red-200 bg-red-50/50 hover:bg-red-50'
  return 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
}

const nextStatus = (status: string) => {
  if (status === 'PENDING') return 'IN_PROGRESS'
  if (status === 'IN_PROGRESS') return 'COMPLETED'
  return null
}

const actionText = (req: ITRequestRow) => {
  if (req.status === 'COMPLETED') return null
  if (req.type === 'OFFBOARDING') return 'รับเรื่องและบันทึกคืนอุปกรณ์'
  return req.status === 'PENDING' ? 'เริ่มดำเนินการ' : 'ทำเครื่องหมายว่าเสร็จสิ้น'
}

const advanceRequest = async (req: ITRequestRow) => {
  const target = nextStatus(req.status)
  if (!target) return

  updatingId.value = req.id
  try {
    await $fetch(`/api/it-requests/${req.id}`, {
      method: 'PATCH',
      body: { status: target }
    })
    await refresh()
  } catch {
    alert('อัปเดตสถานะไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  } finally {
    updatingId.value = null
  }
}
</script>

<template>
  <RequirePermission requiredRole="IT_ADMIN">
    <PageHeader title="คำขออุปกรณ์ IT" subtitle="จัดการคำขอเบิกอุปกรณ์และสิทธิ์เข้าใช้งานสำหรับพนักงานใหม่" color="purple">
      <template #icon>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
      </template>
      <template #actions>
        <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อพนักงาน..." class="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500">
      </template>
    </PageHeader>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div class="p-6">
        <div class="space-y-3">
          <div v-for="req in paginatedRequests" :key="req.id" class="border rounded-xl p-4 flex justify-between items-center transition-colors" :class="cardClass(req)">
            <div>
              <div class="flex items-center gap-3 mb-1 flex-wrap">
                <span class="font-bold text-slate-800">{{ req.employeeName }}</span>
                <StatusBadge :text="statusLabel[req.status]?.text" :color="statusLabel[req.status]?.color" />
                <StatusBadge v-if="req.priority && req.priority !== 'NORMAL'" :text="`ความเร่งด่วน: ${priorityLabel(req.priority)}`" :color="priorityBadgeColor(req.priority)" />
              </div>
              <p class="text-sm text-slate-600 mb-2">สิ่งที่ขอ: {{ formatRequestedItems(req.requestedItems) }}</p>
              <p class="text-xs text-slate-500">ร้องขอโดยฝ่าย HR: {{ req.requestedBy || '-' }} เมื่อวันที่ {{ req.createdAt?.slice(0, 10) }}</p>
            </div>
            <div class="flex gap-2">
              <button @click="openDetail(req)" class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700">ดูรายละเอียด</button>
              <button
                v-if="actionText(req)"
                @click="advanceRequest(req)"
                :disabled="updatingId === req.id"
                class="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 shadow-sm"
                :class="req.type === 'OFFBOARDING' ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'">
                {{ updatingId === req.id ? 'กำลังอัปเดต...' : actionText(req) }}
              </button>
            </div>
          </div>
          <EmptyState v-if="filteredRequests.length === 0" message="ไม่พบคำขอที่ค้นหา" />
        </div>
      </div>
      <AppPagination v-model:currentPage="currentPage" :totalItems="filteredRequests.length" :itemsPerPage="10" />
    </div>

    <ITRequestDetailModal v-if="selectedRequest" :request="selectedRequest" @close="selectedRequest = null" />
  </RequirePermission>
</template>
