<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
import RequirePermission from '~/components/admin/RequirePermission.vue'
import EmployeeProfileTabs from '~/components/admin/EmployeeProfileTabs.vue'
import StatusBadge from '~/components/admin/StatusBadge.vue'
import Modal from '~/components/admin/Modal.vue'
import { hireTypeLabel, hireTypeDateField } from '~/utils/hireType'
import { tenure, daysUntil } from '~/utils/tenure'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const employeeId = route.params.id as string

const { data: employee, refresh } = await useFetch<any>(`/api/employees/${employeeId}`)

const dateField = computed(() => hireTypeDateField(employee.value?.hireType ?? employee.value?.employeeType))
const tenureInfo = computed(() => tenure(employee.value?.startDate))
const deadlineInfo = computed(() => {
  if (!employee.value) return null
  const date = dateField.value === 'probation' ? employee.value.probationDate
    : dateField.value === 'contract' ? employee.value.contractEndDate
      : null
  if (!date) return null
  const d = daysUntil(date)
  if (d === null) return null
  const label = dateField.value === 'probation' ? 'ครบกำหนดทดลองงาน' : 'สัญญาหมดอายุ'
  return { days: d, text: d < 0 ? `เลยกำหนด ${-d} วัน` : d === 0 ? 'วันนี้' : `อีก ${d} วัน`, label }
})

const showRenewModal = ref(false)
const renewForm = reactive({ newEndDate: '', note: '' })
const isRenewing = ref(false)

const openRenewModal = () => {
  renewForm.newEndDate = ''
  renewForm.note = ''
  showRenewModal.value = true
}

const submitRenew = async () => {
  if (!renewForm.newEndDate) {
    alert('กรุณาระบุวันหมดสัญญาใหม่')
    return
  }
  isRenewing.value = true
  try {
    await $fetch(`/api/employees/${employeeId}/renew-contract`, {
      method: 'POST',
      body: { newEndDate: renewForm.newEndDate, note: renewForm.note || undefined }
    })
    showRenewModal.value = false
    await refresh()
  } catch {
    alert('ต่อสัญญาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  } finally {
    isRenewing.value = false
  }
}

const statusMeta: Record<string, { text: string; color: 'green' | 'red' | 'slate' }> = {
  APPROVED: { text: 'พนักงานปัจจุบัน', color: 'green' },
  OFFBOARDED: { text: 'ลาออกแล้ว', color: 'red' },
  SUBMITTED: { text: 'รอตรวจสอบ', color: 'slate' }
}
</script>

<template>
  <RequirePermission requiredRole="HR_ADMIN">
    <div v-if="!employee" class="flex justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    </div>
    <div v-else class="max-w-4xl mx-auto space-y-6">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-4">
          <button @click="router.back()" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md">
              {{ employee.firstName?.[0] }}
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-800">{{ employee.firstName }} {{ employee.lastName }}</h2>
              <p class="text-sm text-slate-500 mt-0.5">ประวัติพนักงาน</p>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <NuxtLink :to="`/admin/hr/applications/preview/${employeeId}`" target="_blank" class="px-4 py-2 bg-blue-600 border border-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            ดูใบสมัครงาน
          </NuxtLink>
          <StatusBadge :text="statusMeta[employee.status]?.text || employee.status" :color="statusMeta[employee.status]?.color || 'slate'" />
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-y-5 gap-x-6">
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">แผนก</p>
          <p class="font-medium text-slate-900">{{ employee.department || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">หัวหน้างาน</p>
          <p class="font-medium text-slate-900">{{ employee.managerName || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">สถานะการจ้าง</p>
          <p class="font-medium text-slate-900">{{ hireTypeLabel(employee.hireType ?? employee.employeeType) }}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">วันที่เริ่มงาน</p>
          <p class="font-medium text-slate-900">{{ employee.startDate?.slice(0, 10) || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">อายุงาน</p>
          <p class="font-medium text-slate-900">{{ tenureInfo?.label || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">เบอร์โทร/อีเมล</p>
          <p class="font-medium text-slate-900">{{ employee.phone }} / {{ employee.email }}</p>
        </div>
        <div v-if="dateField === 'probation'">
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">วันที่ผ่านทดลองงาน</p>
          <p class="font-medium text-slate-900">
            {{ employee.probationDate?.slice(0, 10) || '-' }}
            <span v-if="deadlineInfo" class="ml-1 text-xs" :class="deadlineInfo.days < 0 ? 'text-rose-600' : deadlineInfo.days <= 7 ? 'text-amber-600' : 'text-slate-400'">({{ deadlineInfo.text }})</span>
          </p>
        </div>
      </div>

      <!-- Contract card for รายวัน / สัญญาจ้าง -->
      <div v-if="dateField === 'contract'" class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-sm border border-amber-100 p-6">
        <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h3 class="text-lg font-bold text-amber-900">สัญญาจ้าง</h3>
            <p class="text-sm text-amber-700/80 mt-0.5">
              วันหมดสัญญาปัจจุบัน: {{ employee.contractEndDate?.slice(0, 10) || '-' }}
              <span v-if="deadlineInfo" class="ml-1 font-semibold" :class="deadlineInfo.days < 0 ? 'text-rose-600' : deadlineInfo.days <= 7 ? 'text-rose-500' : 'text-amber-700'">({{ deadlineInfo.text }})</span>
            </p>
          </div>
          <button @click="openRenewModal" class="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 shadow-sm flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            ต่อสัญญา
          </button>
        </div>

        <div v-if="employee.contractRenewals?.length" class="space-y-2 mt-4 pt-4 border-t border-amber-200/60">
          <p class="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">ประวัติการต่อสัญญา</p>
          <div v-for="renewal in employee.contractRenewals" :key="renewal.id" class="flex items-center justify-between bg-white/60 rounded-lg px-4 py-2.5 text-sm">
            <div>
              <span class="text-slate-500">{{ renewal.previousEndDate?.slice(0, 10) || 'ไม่มี' }}</span>
              <span class="mx-2 text-amber-500">&rarr;</span>
              <span class="font-semibold text-slate-800">{{ renewal.newEndDate.slice(0, 10) }}</span>
              <span v-if="renewal.note" class="text-slate-400 ml-2">({{ renewal.note }})</span>
            </div>
            <span class="text-xs text-slate-400">{{ renewal.renewedBy }} · {{ renewal.createdAt.slice(0, 10) }}</span>
          </div>
        </div>
      </div>

      <EmployeeProfileTabs
        :form-data="employee.formData"
        :documents="employee.documents"
        :it-requests="employee.itRequests"
        :employee="employee"
        editable
        @saved="refresh"
      />
    </div>

    <Modal v-if="showRenewModal" title="ต่อสัญญาจ้าง" @close="showRenewModal = false">
      <div class="space-y-4">
        <div>
          <p class="text-sm text-slate-500 mb-1">วันหมดสัญญาปัจจุบัน</p>
          <p class="font-medium text-slate-900">{{ employee.contractEndDate?.slice(0, 10) || '-' }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">วันหมดสัญญาใหม่ <span class="text-red-500">*</span></label>
          <input v-model="renewForm.newEndDate" type="date" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">หมายเหตุ</label>
          <textarea v-model="renewForm.note" rows="3" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"></textarea>
        </div>
      </div>
      <template #footer>
        <button @click="showRenewModal = false" class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700">ยกเลิก</button>
        <button @click="submitRenew" :disabled="isRenewing" class="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
          {{ isRenewing ? 'กำลังบันทึก...' : 'ยืนยันต่อสัญญา' }}
        </button>
      </template>
    </Modal>
  </RequirePermission>
</template>
