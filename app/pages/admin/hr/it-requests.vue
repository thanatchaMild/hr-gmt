<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
import RequirePermission from '~/components/admin/RequirePermission.vue'
import PageHeader from '~/components/admin/PageHeader.vue'
import StatusBadge from '~/components/admin/StatusBadge.vue'
import EmptyState from '~/components/admin/EmptyState.vue'
import ITRequestModal from '~/components/admin/ITRequestModal.vue'
import ITRequestDetailModal from '~/components/admin/ITRequestDetailModal.vue'

interface EmployeeOption {
  id: string
  firstName: string
  lastName: string
  employeeType: string
  department: string | null
  startDate: string | null
}

interface ITRequestRow {
  id: string
  employeeName: string
  status: string
  type: string
  requestedItems: string[]
  requestType: string | null
  department: string | null
  approver: string | null
  notes: string | null
  requestedBy: string | null
  createdAt: string
}

const { data: employeesData } = await useFetch<{ employees: EmployeeOption[] }>('/api/employees')
const { data: requestsData, refresh } = await useFetch<{ requests: ITRequestRow[] }>('/api/it-requests')

const employees = computed(() => employeesData.value?.employees || [])
const requests = computed(() => requestsData.value?.requests || [])

const statusLabel: Record<string, { text: string; color: 'yellow' | 'blue' | 'green' }> = {
  PENDING: { text: 'รอดำเนินการโดยฝ่าย IT', color: 'yellow' },
  IN_PROGRESS: { text: 'กำลังดำเนินการ', color: 'blue' },
  COMPLETED: { text: 'ดำเนินการเสร็จสิ้น', color: 'green' }
}

const showITModal = ref(false)
const selectedRequest = ref<ITRequestRow | null>(null)

const searchQuery = ref('')

const filteredRequests = computed(() => {
  if (!searchQuery.value) return requests.value
  const q = searchQuery.value.toLowerCase()
  return requests.value.filter(req => req.employeeName.toLowerCase().includes(q))
})

const openITModal = () => {
  showITModal.value = true
}

const openDetail = (req: ITRequestRow) => {
  selectedRequest.value = req
}

const closeITModal = () => {
  showITModal.value = false
}

const onITRequestSubmitted = async () => {
  await refresh()
}
</script>

<template>
  <RequirePermission requiredRole="HR_ADMIN">
    <PageHeader title="คำขอเบิกอุปกรณ์ IT" subtitle="ประวัติการส่งคำขอเบิกอุปกรณ์และสิทธิ์เข้าใช้งานให้พนักงานใหม่" color="blue">
      <template #icon>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
      </template>
      <template #actions>
        <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อพนักงาน..." class="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
        <button @click="openITModal" class="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/20 flex items-center gap-2 whitespace-nowrap">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          สร้างคำขอใหม่
        </button>
      </template>
    </PageHeader>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div class="p-6">
        <div class="space-y-3">
          <div v-for="req in filteredRequests" :key="req.id" class="border rounded-xl p-4 flex justify-between items-center transition-colors" :class="req.type === 'OFFBOARDING' ? 'border-red-200 bg-red-50/30 hover:bg-red-50' : 'border-slate-200 hover:bg-slate-50'">
            <div>
              <div class="flex items-center gap-3 mb-1">
                <span class="font-bold text-slate-800">{{ req.employeeName }}</span>
                <StatusBadge :text="statusLabel[req.status]?.text" :color="statusLabel[req.status]?.color" />
              </div>
              <p class="text-sm text-slate-600 mb-2">สิ่งที่ขอ: {{ req.requestedItems.join(', ') || '-' }}</p>
              <p class="text-xs text-slate-500">วันที่ส่งคำขอ: {{ req.createdAt?.slice(0, 10) }}</p>
            </div>
            <div class="flex gap-2">
              <button @click="openDetail(req)" class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700">ดูรายละเอียด</button>
            </div>
          </div>
          <EmptyState v-if="filteredRequests.length === 0" message="ไม่พบคำขอที่ค้นหา" />
        </div>
      </div>
    </div>

    <!-- IT Request Modal -->
    <ITRequestModal
      v-if="showITModal"
      :employees="employees"
      @close="closeITModal"
      @submitted="onITRequestSubmitted"
    />

    <ITRequestDetailModal v-if="selectedRequest" :request="selectedRequest" @close="selectedRequest = null" />
  </RequirePermission>
</template>
