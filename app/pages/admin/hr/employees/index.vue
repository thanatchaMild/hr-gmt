<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
import RequirePermission from '~/components/admin/RequirePermission.vue'
import PageHeader from '~/components/admin/PageHeader.vue'
import StatusBadge from '~/components/admin/StatusBadge.vue'
import EmptyState from '~/components/admin/EmptyState.vue'
import Modal from '~/components/admin/Modal.vue'
import { DEPARTMENTS } from '~/utils/departments'

interface EmployeeRow {
  id: string
  firstName: string
  lastName: string
  employeeType: 'DAILY' | 'MONTHLY'
  status: string
  department: string | null
  startDate: string | null
  probationDate: string | null
  contractEndDate: string | null
}

const { data, refresh } = await useFetch<{ employees: EmployeeRow[] }>('/api/employees', {
  query: { status: 'APPROVED' }
})

const employees = computed(() => data.value?.employees || [])

const searchQuery = ref('')
const filterDepartment = ref('')
const filterEmployeeType = ref('')
const filterProbationDateFrom = ref('')
const filterProbationDateTo = ref('')
const filterContractEndDateFrom = ref('')
const filterContractEndDateTo = ref('')

function inRange(dateValue: string | null, from: string, to: string) {
  if (!from && !to) return true
  if (!dateValue) return false
  const d = dateValue.slice(0, 10)
  if (from && d < from) return false
  if (to && d > to) return false
  return true
}

const filteredEmployees = computed(() => {
  return employees.value.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase()
    if (searchQuery.value && !fullName.includes(searchQuery.value.toLowerCase())) {
      return false
    }
    if (filterDepartment.value && emp.department !== filterDepartment.value) {
      return false
    }
    if (filterEmployeeType.value && emp.employeeType !== filterEmployeeType.value) {
      return false
    }
    if (!inRange(emp.probationDate, filterProbationDateFrom.value, filterProbationDateTo.value)) {
      return false
    }
    if (!inRange(emp.contractEndDate, filterContractEndDateFrom.value, filterContractEndDateTo.value)) {
      return false
    }
    return true
  })
})

function isContractSoon(contractEndDate: string | null) {
  if (!contractEndDate) return false
  const days = (new Date(contractEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return days >= 0 && days <= 7
}

const showOffboardModal = ref(false)
const selectedEmployee = ref<EmployeeRow | null>(null)
const isSubmitting = ref(false)
const offboardRequest = reactive({
  resignDate: '',
  disableEmail: true,
  disableERP: true,
  returnAsset: true,
  additionalNotes: ''
})

const openOffboardModal = (emp: EmployeeRow) => {
  selectedEmployee.value = emp
  showOffboardModal.value = true
}

const closeOffboardModal = () => {
  showOffboardModal.value = false
  selectedEmployee.value = null
  offboardRequest.resignDate = ''
  offboardRequest.disableEmail = true
  offboardRequest.disableERP = true
  offboardRequest.returnAsset = true
  offboardRequest.additionalNotes = ''
}

const submitOffboardRequest = async () => {
  if (!selectedEmployee.value) return
  if (!offboardRequest.resignDate) {
    alert('กรุณาระบุวันที่มีผลลาออก')
    return
  }

  const items = []
  if (offboardRequest.disableEmail) items.push('ปิด Email/Account')
  if (offboardRequest.disableERP) items.push('ระงับสิทธิ์ ERP')
  if (offboardRequest.returnAsset) items.push('ติดตามรับคืนทรัพย์สิน')

  isSubmitting.value = true
  try {
    await $fetch(`/api/employees/${selectedEmployee.value.id}`, {
      method: 'PATCH',
      body: { status: 'OFFBOARDED' }
    })
    await $fetch('/api/it-requests', {
      method: 'POST',
      body: {
        employeeId: selectedEmployee.value.id,
        employeeName: `${selectedEmployee.value.firstName} ${selectedEmployee.value.lastName}`,
        type: 'OFFBOARDING',
        requestedItems: items,
        department: selectedEmployee.value.department || undefined,
        notes: `วันที่มีผลลาออก: ${offboardRequest.resignDate}. ${offboardRequest.additionalNotes}`
      }
    })
    alert(`แจ้งข้อมูลการลาออกของ ${selectedEmployee.value.firstName} ${selectedEmployee.value.lastName} ให้ฝ่าย IT ทราบเรียบร้อยแล้ว`)
    closeOffboardModal()
    await refresh()
  } catch {
    alert('ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <RequirePermission requiredRole="HR_ADMIN">
    <PageHeader title="ข้อมูลพนักงานทั้งหมด" subtitle="รายชื่อพนักงานที่ผ่านการอนุมัติและปฏิบัติงานอยู่" color="blue">
      <template #icon>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
      </template>
    </PageHeader>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 relative">
      <div class="p-6 border-b border-slate-200 bg-slate-50/60 rounded-t-2xl">
        <div class="flex flex-wrap items-end gap-x-5 gap-y-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-slate-500">แผนก</label>
            <select v-model="filterDepartment" class="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
              <option value="">ทุกแผนก</option>
              <option v-for="dept in DEPARTMENTS" :key="dept" :value="dept">{{ dept }}</option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-slate-500">ประเภท</label>
            <select v-model="filterEmployeeType" class="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
              <option value="">ทุกประเภท</option>
              <option value="MONTHLY">รายเดือน</option>
              <option value="DAILY">รายวัน</option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-slate-500">ผ่านทดลองงาน</label>
            <div class="flex items-center gap-1.5 px-2 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500">
              <input v-model="filterProbationDateFrom" type="date" class="py-2 text-sm border-none bg-transparent focus:outline-none focus:ring-0 w-[130px]">
              <span class="text-slate-300">–</span>
              <input v-model="filterProbationDateTo" type="date" class="py-2 text-sm border-none bg-transparent focus:outline-none focus:ring-0 w-[130px]">
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-slate-500">วันหมดสัญญา</label>
            <div class="flex items-center gap-1.5 px-2 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500">
              <input v-model="filterContractEndDateFrom" type="date" class="py-2 text-sm border-none bg-transparent focus:outline-none focus:ring-0 w-[130px]">
              <span class="text-slate-300">–</span>
              <input v-model="filterContractEndDateTo" type="date" class="py-2 text-sm border-none bg-transparent focus:outline-none focus:ring-0 w-[130px]">
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-slate-500">ค้นหา</label>
            <div class="relative">
              <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อพนักงาน..." class="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 w-56">
            </div>
          </div>
        </div>
      </div>
      <div class="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-blue-600"></div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-xs">
            <tr>
              <th class="px-6 py-3 font-semibold">ชื่อ-นามสกุล</th>
              <th class="px-6 py-3 font-semibold">แผนก</th>
              <th class="px-6 py-3 font-semibold">ประเภท</th>
              <th class="px-6 py-3 font-semibold">สถานะ</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">วันที่เริ่มงาน</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">วันที่ผ่านทดลองงาน</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">วันหมดสัญญา</th>
              <th class="px-6 py-3 font-semibold text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="emp in filteredEmployees" :key="emp.id" class="hover:bg-blue-50/30 transition-colors">
              <td class="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                {{ emp.firstName }} {{ emp.lastName }}
              </td>
              <td class="px-6 py-4 text-slate-700">{{ emp.department || '-' }}</td>
              <td class="px-6 py-4">
                <StatusBadge :text="emp.employeeType === 'MONTHLY' ? 'รายเดือน' : 'รายวัน'" :color="emp.employeeType === 'MONTHLY' ? 'purple' : 'blue'" />
              </td>
              <td class="px-6 py-4">
                <StatusBadge text="พนักงานปัจจุบัน" color="green" />
              </td>
              <td class="px-6 py-4 text-slate-600 whitespace-nowrap">{{ emp.startDate?.slice(0, 10) || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="emp.employeeType === 'MONTHLY'" class="text-slate-600">{{ emp.probationDate?.slice(0, 10) || '-' }}</span>
                <span v-else class="text-slate-300">—</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="emp.employeeType === 'DAILY'" :class="isContractSoon(emp.contractEndDate) ? 'text-red-600 font-semibold' : 'text-slate-600'">
                  {{ emp.contractEndDate?.slice(0, 10) || '-' }}
                </span>
                <span v-else class="text-slate-300">—</span>
              </td>
              <td class="px-6 py-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openOffboardModal(emp)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    แจ้งลาออก
                  </button>
                  <NuxtLink :to="`/admin/hr/employees/${emp.id}`" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    ดูรายละเอียด
                  </NuxtLink>
                  <NuxtLink :to="`/admin/hr/applications/edit/${emp.id}`" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    แก้ไขข้อมูล
                  </NuxtLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="filteredEmployees.length === 0" message="ไม่พบข้อมูลพนักงานในขอบเขตสิทธิ์ของคุณ" />
      </div>
    </div>

    <!-- Offboarding Request Modal -->
    <Modal v-if="showOffboardModal" title="แจ้งการลาออก (Offboarding)" tone="danger" @close="closeOffboardModal">
      <div class="space-y-4">
        <div>
          <p class="text-sm text-slate-500 mb-1">พนักงานที่ลาออก</p>
          <p class="font-medium text-slate-900">{{ selectedEmployee?.firstName }} {{ selectedEmployee?.lastName }} ({{ selectedEmployee?.employeeType }})</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">วันที่มีผลลาออก (วันทำงานสุดท้าย)</label>
          <input type="date" v-model="offboardRequest.resignDate" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500">
        </div>

        <div class="space-y-3">
          <p class="text-sm font-medium text-slate-700">รายการที่ให้ IT ดำเนินการระงับสิทธิ์และรับคืน</p>
          <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
            <input type="checkbox" v-model="offboardRequest.disableEmail" class="w-5 h-5 text-red-600 rounded">
            <span class="text-sm font-medium">ปิดบัญชีอีเมลบริษัทและ Account</span>
          </label>
          <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
            <input type="checkbox" v-model="offboardRequest.disableERP" class="w-5 h-5 text-red-600 rounded">
            <span class="text-sm font-medium">ระงับสิทธิ์เข้าใช้งาน ERP / VPN</span>
          </label>
          <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
            <input type="checkbox" v-model="offboardRequest.returnAsset" class="w-5 h-5 text-red-600 rounded">
            <span class="text-sm font-medium">ติดตามรับคืนอุปกรณ์และทรัพย์สิน IT</span>
          </label>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">หมายเหตุเพิ่มเติม</label>
          <textarea v-model="offboardRequest.additionalNotes" rows="3" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"></textarea>
        </div>
      </div>
      <template #footer>
        <button @click="closeOffboardModal" class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700">ยกเลิก</button>
        <button @click="submitOffboardRequest" :disabled="isSubmitting" class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
          {{ isSubmitting ? 'กำลังส่ง...' : 'ยืนยันแจ้งลาออกให้ IT' }}
        </button>
      </template>
    </Modal>
  </RequirePermission>
</template>
