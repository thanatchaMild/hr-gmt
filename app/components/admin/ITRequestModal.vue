<script setup lang="ts">
import Modal from '~/components/admin/Modal.vue'
import { IT_REQUEST_TYPES } from '~/utils/itRequestTypes'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

interface EmployeeOption {
  id: string
  firstName: string
  lastName: string
  employeeType: string
  department?: string | null
  startDate?: string | null
}

const props = withDefaults(defineProps<{
  presetEmployee?: EmployeeOption | null
  presetApprover?: string
  employees?: EmployeeOption[]
}>(), {
  presetEmployee: null,
  presetApprover: '',
  employees: () => []
})

const emit = defineEmits<{ close: []; submitted: [] }>()

const selectedEmployeeId = ref(props.presetEmployee?.id || '')

const itRequest = reactive({
  requester: authStore.user?.name || '',
  endUser: props.presetEmployee ? `${props.presetEmployee.firstName} ${props.presetEmployee.lastName}` : '',
  department: props.presetEmployee?.department || '',
  approver: props.presetApprover || '',
  startDate: props.presetEmployee?.startDate?.slice(0, 10) || '',
  requestTypes: [] as string[],
  additionalNotes: ''
})

// Searchable employee combobox
const employeeSearch = ref(props.presetEmployee ? `${props.presetEmployee.firstName} ${props.presetEmployee.lastName}` : '')
const showEmployeeOptions = ref(false)
const employeeFieldEl = ref<HTMLElement | null>(null)

const filteredEmployees = computed(() => {
  const q = employeeSearch.value.trim().toLowerCase()
  if (!q) return props.employees
  return props.employees.filter(emp => `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q))
})

const selectEmployee = (emp: EmployeeOption) => {
  selectedEmployeeId.value = emp.id
  employeeSearch.value = `${emp.firstName} ${emp.lastName}`
  showEmployeeOptions.value = false
}

const handleClickOutsideEmployeeField = (e: MouseEvent) => {
  if (employeeFieldEl.value && !employeeFieldEl.value.contains(e.target as Node)) {
    showEmployeeOptions.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutsideEmployeeField))
onUnmounted(() => document.removeEventListener('click', handleClickOutsideEmployeeField))

watch(selectedEmployeeId, (id) => {
  if (props.presetEmployee) return
  const emp = props.employees.find(e => e.id === id)
  if (emp) {
    itRequest.endUser = `${emp.firstName} ${emp.lastName}`
    itRequest.department = emp.department || ''
    itRequest.startDate = emp.startDate?.slice(0, 10) || ''
  }
})

const isSubmitting = ref(false)

const submit = async () => {
  const employeeId = props.presetEmployee?.id || selectedEmployeeId.value
  if (!employeeId) {
    alert('กรุณาเลือกพนักงาน')
    return
  }
  if (!itRequest.endUser || !itRequest.department || !itRequest.approver || !itRequest.startDate || itRequest.requestTypes.length === 0) {
    alert('กรุณากรอกข้อมูลให้ครบถ้วน และเลือกประเภทคำขออย่างน้อย 1 รายการ')
    return
  }

  isSubmitting.value = true
  try {
    const notes = [
      itRequest.startDate ? `วันเริ่มงาน: ${itRequest.startDate}` : null,
      itRequest.additionalNotes || null
    ].filter(Boolean).join('\n')

    await $fetch('/api/it-requests', {
      method: 'POST',
      body: {
        employeeId,
        employeeName: itRequest.endUser,
        type: 'ONBOARDING',
        requestedItems: itRequest.requestTypes.map(id => IT_REQUEST_TYPES.find(t => t.id === id)?.name || id),
        requestType: itRequest.requestTypes.join(','),
        department: itRequest.department,
        approver: itRequest.approver,
        notes: notes || undefined
      }
    })
    alert('ส่งคำขอ IT เรียบร้อยแล้ว')
    emit('submitted')
    emit('close')
  } catch {
    alert('ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Modal title="ส่งคำขอ IT สำหรับพนักงานใหม่" max-width="2xl" @close="emit('close')">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 mb-4">
      <div v-if="!presetEmployee" class="md:col-span-2" ref="employeeFieldEl">
        <label class="block text-sm text-slate-600 mb-1.5">เลือกพนักงาน <span class="text-red-500">*</span></label>
        <div class="relative">
          <input
            type="text"
            v-model="employeeSearch"
            @focus="showEmployeeOptions = true"
            @input="showEmployeeOptions = true; selectedEmployeeId = ''"
            placeholder="พิมพ์ชื่อพนักงานเพื่อค้นหา..."
            class="block w-full px-3 py-2 text-sm border border-slate-300 bg-white rounded-lg shadow-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          >
          <svg class="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>

          <div v-if="showEmployeeOptions" class="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
            <button
              type="button"
              v-for="emp in filteredEmployees"
              :key="emp.id"
              @click="selectEmployee(emp)"
              class="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between gap-2"
              :class="selectedEmployeeId === emp.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'"
            >
              <span>{{ emp.firstName }} {{ emp.lastName }}</span>
              <span class="text-xs text-slate-400 flex-shrink-0">{{ emp.employeeType === 'MONTHLY' ? 'รายเดือน' : 'รายวัน' }}</span>
            </button>
            <p v-if="filteredEmployees.length === 0" class="px-3 py-3 text-sm text-slate-400 text-center">ไม่พบพนักงานที่ค้นหา</p>
          </div>
        </div>
      </div>
      <div>
        <label class="block text-sm text-slate-600 mb-1.5">ผู้ขอ (Requester)</label>
        <input type="text" v-model="itRequest.requester" readonly
          class="block w-full px-3 py-2 text-sm border border-slate-200 bg-slate-50 rounded-lg shadow-sm text-slate-500">
      </div>
      <div>
        <label class="block text-sm text-slate-600 mb-1.5">ผู้ใช้งาน (End User) <span class="text-red-500">*</span></label>
        <input type="text" v-model="itRequest.endUser" required
          class="block w-full px-3 py-2 text-sm border border-slate-300 bg-slate-50 rounded-lg shadow-sm text-slate-700">
      </div>
      <div>
        <label class="block text-sm text-slate-600 mb-1.5">แผนก (Department) <span class="text-red-500">*</span></label>
        <input type="text" v-model="itRequest.department" required
          class="block w-full px-3 py-2 text-sm border border-slate-300 bg-slate-50 rounded-lg shadow-sm text-slate-700">
      </div>
      <div>
        <label class="block text-sm text-slate-600 mb-1.5">ผู้อนุมัติ (Approver) <span class="text-red-500">*</span></label>
        <input type="text" v-model="itRequest.approver" required placeholder="ชื่อหัวหน้างาน/ผู้มีอำนาจ"
          class="block w-full px-3 py-2 text-sm border border-slate-300 bg-white rounded-lg shadow-sm text-slate-700">
      </div>
      <div>
        <label class="block text-sm text-slate-600 mb-1.5">วันเริ่มงาน (Start Date) <span class="text-red-500">*</span></label>
        <input type="date" v-model="itRequest.startDate" required
          class="block w-full px-3 py-2 text-sm border border-slate-300 bg-white rounded-lg shadow-sm text-slate-700">
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm text-slate-600 mb-1.5">ประเภทคำขอ (เลือกได้มากกว่า 1 รายการ) <span class="text-red-500">*</span></label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label v-for="type in IT_REQUEST_TYPES" :key="type.id"
            class="flex items-center gap-2.5 px-3 py-2 border rounded-lg text-sm cursor-pointer transition-colors"
            :class="itRequest.requestTypes.includes(type.id) ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'">
            <input type="checkbox" :value="type.id" v-model="itRequest.requestTypes" class="w-4 h-4 text-blue-600 rounded flex-shrink-0">
            {{ type.name }}
          </label>
        </div>
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1.5">รายละเอียด/หมายเหตุถึงแผนก IT</label>
      <textarea v-model="itRequest.additionalNotes" rows="3" placeholder="ระบุสเปคอุปกรณ์ หรือสิทธิ์การเข้าถึงระบบต่างๆ ที่ต้องการ"
        class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg shadow-sm text-slate-700"></textarea>
    </div>
    <template #footer>
      <button @click="emit('close')" class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700">ยกเลิก</button>
      <button @click="submit" :disabled="isSubmitting" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shadow-sm">
        {{ isSubmitting ? 'กำลังส่ง...' : 'ส่งคำขอถึง IT' }}
      </button>
    </template>
  </Modal>
</template>
