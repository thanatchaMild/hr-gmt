<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
import RequirePermission from '~/components/admin/RequirePermission.vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { IT_REQUEST_TYPES } from '~/utils/itRequestTypes'
import { PRIORITIES } from '~/utils/itRequest'
import { hireTypeLabel } from '~/utils/hireType'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

interface EmployeeOption {
  id: number
  firstName: string
  lastName: string
  employeeType: string
  hireType: string | null
  employeeCode: string | null
  department: string | null
  email: string | null
}

const { data: employeesData } = await useFetch<{ employees: EmployeeOption[] }>('/api/employees')
const employees = computed(() => employeesData.value?.employees || [])

const form = reactive({
  requestFor: 'SELF' as 'SELF' | 'OTHER',
  requesterName: authStore.user?.name || '',
  requesterEmployeeCode: '',
  department: '',
  contactEmail: '',
  priority: 'NORMAL' as string,
  neededDate: '',
  returnDate: '',
  notes: ''
})

interface ItemRow { category: string; name: string; quantity: number; note: string }
const items = ref<ItemRow[]>([])
const files = ref<File[]>([])

// --- "ขอให้คนอื่น": searchable employee combobox ---
const selectedEmployeeId = ref<number | null>(null)
const employeeSearch = ref('')
const showEmployeeOptions = ref(false)
const employeeFieldEl = ref<HTMLElement | null>(null)

const filteredEmployees = computed(() => {
  const q = employeeSearch.value.trim().toLowerCase()
  if (!q) return employees.value
  return employees.value.filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(q))
})

function applyEmployee(emp: EmployeeOption | undefined | null) {
  if (!emp) return
  selectedEmployeeId.value = emp.id
  employeeSearch.value = `${emp.firstName} ${emp.lastName}`
  form.requesterName = `${emp.firstName} ${emp.lastName}`
  form.requesterEmployeeCode = emp.employeeCode || ''
  form.department = emp.department || ''
  form.contactEmail = emp.email || ''
  showEmployeeOptions.value = false
}

function selectEmployee(emp: EmployeeOption) {
  applyEmployee(emp)
}

watch(() => form.requestFor, (val) => {
  if (val === 'SELF') {
    selectedEmployeeId.value = null
    employeeSearch.value = ''
    form.requesterName = authStore.user?.name || ''
    form.requesterEmployeeCode = ''
    form.department = ''
    form.contactEmail = ''
  }
})

// Preset from ?employeeId=
watch(employees, (list) => {
  const presetId = Number(route.query.employeeId)
  if (presetId && !selectedEmployeeId.value) {
    const emp = list.find(e => e.id === presetId)
    if (emp) {
      form.requestFor = 'OTHER'
      applyEmployee(emp)
    }
  }
}, { immediate: true })

const handleClickOutside = (e: MouseEvent) => {
  if (employeeFieldEl.value && !employeeFieldEl.value.contains(e.target as Node)) {
    showEmployeeOptions.value = false
  }
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

// --- items ---
function addItem() {
  items.value.push({ category: IT_REQUEST_TYPES[0]?.id || '', name: '', quantity: 1, note: '' })
}
function removeItem(idx: number) {
  items.value.splice(idx, 1)
}

// --- files ---
function onFilesPicked(e: Event) {
  const picked = (e.target as HTMLInputElement).files
  if (picked) files.value.push(...Array.from(picked))
  ;(e.target as HTMLInputElement).value = ''
}
function onFilesDropped(e: DragEvent) {
  const dropped = e.dataTransfer?.files
  if (dropped) files.value.push(...Array.from(dropped))
}
function removeFile(idx: number) {
  files.value.splice(idx, 1)
}
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const priorityLabelText = computed(() => PRIORITIES.find(p => p.code === form.priority)?.label || 'ปกติ')

const canSubmit = computed(() =>
  items.value.length > 0 &&
  items.value.every(i => i.name.trim() || i.category) &&
  form.department.trim() !== '' &&
  form.requesterName.trim() !== '' &&
  (form.requestFor === 'SELF' || selectedEmployeeId.value !== null)
)

const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

async function uploadFiles(): Promise<{ name: string; url: string }[]> {
  const out: { name: string; url: string }[] = []
  for (const f of files.value) {
    const fd = new FormData()
    fd.append('file', f)
    const { url } = await $fetch<{ url: string }>('/api/uploads', { method: 'POST', body: fd })
    out.push({ name: f.name, url })
  }
  return out
}

async function submit() {
  if (!canSubmit.value || isSubmitting.value) return
  isSubmitting.value = true
  submitError.value = null
  try {
    const attachments = await uploadFiles()
    await $fetch('/api/it-requests', {
      method: 'POST',
      body: {
        type: 'ASSET_REQUEST',
        employeeId: form.requestFor === 'OTHER' ? selectedEmployeeId.value : undefined,
        employeeName: form.requesterName.trim(),
        requestFor: form.requestFor,
        requesterName: form.requesterName.trim(),
        requesterEmployeeCode: form.requesterEmployeeCode.trim() || undefined,
        department: form.department.trim(),
        contactEmail: form.contactEmail.trim() || undefined,
        priority: form.priority,
        neededDate: form.neededDate || undefined,
        returnDate: form.returnDate || undefined,
        notes: form.notes.trim() || undefined,
        items: items.value.map(i => ({ ...i, name: i.name.trim(), note: i.note.trim() })),
        attachments
      }
    })
    await router.push('/admin/hr/it-requests')
  } catch (err: any) {
    submitError.value = err?.data?.statusMessage || err?.statusMessage || 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
  } finally {
    isSubmitting.value = false
  }
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500'
</script>

<template>
  <RequirePermission requiredRole="HR_ADMIN">
    <div class="flex items-start gap-3 mb-5">
      <button @click="router.back()" class="mt-1 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
      </button>
      <div>
        <h1 class="text-xl font-bold text-slate-800">สร้างคำขอทรัพย์สิน IT</h1>
        <p class="text-sm text-slate-500 mt-0.5">กรอกรายละเอียดคำขอให้ครบถ้วนเพื่อความรวดเร็วในการตรวจสอบ</p>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-5 items-start">
      <!-- LEFT: form -->
      <div class="w-full lg:flex-1 space-y-4">
        <!-- Requester -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="px-5 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">i</span>
            <h3 class="text-sm font-bold text-slate-700">ข้อมูลผู้ขออนุมัติ</h3>
          </div>
          <div class="p-5 space-y-3.5">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">ขอทรัพย์สินให้ <span class="text-red-500">*</span></label>
              <div class="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  v-for="opt in [{ v: 'SELF', t: 'ขอให้ตัวเอง' }, { v: 'OTHER', t: 'ขอให้คนอื่น' }]"
                  :key="opt.v"
                  type="button"
                  @click="form.requestFor = (opt.v as 'SELF' | 'OTHER')"
                  class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  :class="form.requestFor === opt.v ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                >{{ opt.t }}</button>
              </div>
            </div>

            <div v-if="form.requestFor === 'OTHER'" ref="employeeFieldEl">
              <label class="block text-sm font-medium text-slate-700 mb-1.5">เลือกพนักงาน <span class="text-red-500">*</span></label>
              <div class="relative">
                <input
                  type="text"
                  v-model="employeeSearch"
                  @focus="showEmployeeOptions = true"
                  @input="showEmployeeOptions = true; selectedEmployeeId = null"
                  placeholder="พิมพ์ชื่อพนักงานเพื่อค้นหา..."
                  :class="inputCls"
                >
                <div v-if="showEmployeeOptions" class="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                  <button
                    type="button"
                    v-for="emp in filteredEmployees"
                    :key="emp.id"
                    @click="selectEmployee(emp)"
                    class="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors flex items-center justify-between gap-2"
                    :class="selectedEmployeeId === emp.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700'"
                  >
                    <span>{{ emp.firstName }} {{ emp.lastName }}</span>
                    <span class="text-xs text-slate-400 flex-shrink-0">{{ hireTypeLabel(emp.hireType ?? emp.employeeType) }}</span>
                  </button>
                  <p v-if="filteredEmployees.length === 0" class="px-3 py-3 text-sm text-slate-400 text-center">ไม่พบพนักงานที่ค้นหา</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">ชื่อ-นามสกุล</label>
                <input v-model="form.requesterName" type="text" :class="inputCls" :readonly="form.requestFor === 'OTHER'">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">รหัสพนักงาน</label>
                <input v-model="form.requesterEmployeeCode" type="text" placeholder="ระบุรหัสพนักงาน (ถ้ามี)" :class="inputCls">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">แผนก/ฝ่าย <span class="text-red-500">*</span></label>
                <input v-model="form.department" type="text" placeholder="เช่น บริหาร-IT" :class="inputCls">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">อีเมลติดต่อ (E-mail)</label>
                <input v-model="form.contactEmail" type="email" placeholder="example@company.com" :class="inputCls">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">ความเร่งด่วน <span class="text-red-500">*</span></label>
                <div class="flex gap-2">
                  <button
                    v-for="p in PRIORITIES"
                    :key="p.code"
                    type="button"
                    @click="form.priority = p.code"
                    class="flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
                    :class="form.priority === p.code ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'"
                  >{{ p.label }}</button>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">วันที่ต้องการ</label>
                <input v-model="form.neededDate" type="date" :class="inputCls">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">กำหนดคืน</label>
                <input v-model="form.returnDate" type="date" :class="inputCls">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">รายละเอียดเพิ่มเติม</label>
              <textarea v-model="form.notes" rows="3" placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)" :class="inputCls"></textarea>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="px-5 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-700 flex items-center gap-2">
              <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              รายการที่ขอ ({{ items.length }})
            </h3>
            <button type="button" @click="addItem" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              เพิ่มรายการ
            </button>
          </div>
          <div class="p-5">
            <div v-if="items.length === 0" class="py-6 text-center text-sm text-slate-400">
              ยังไม่มีรายการที่ขอ กด "เพิ่มรายการ" เพื่อเริ่มกรอกรายการแรก
            </div>
            <div v-else class="space-y-3">
              <div v-for="(item, idx) in items" :key="idx" class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <div class="sm:col-span-3">
                  <label class="block text-xs text-slate-400 mb-1">หมวด</label>
                  <select v-model="item.category" :class="inputCls">
                    <option v-for="t in IT_REQUEST_TYPES" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>
                <div class="sm:col-span-4">
                  <label class="block text-xs text-slate-400 mb-1">ชื่อรายการ</label>
                  <input v-model="item.name" type="text" placeholder="เช่น Notebook Dell Latitude" :class="inputCls">
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-xs text-slate-400 mb-1">จำนวน</label>
                  <input v-model.number="item.quantity" type="number" min="1" :class="inputCls">
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-xs text-slate-400 mb-1">หมายเหตุ</label>
                  <input v-model="item.note" type="text" placeholder="สเปค/เพิ่มเติม" :class="inputCls">
                </div>
                <div class="sm:col-span-1 flex sm:justify-center sm:pt-6">
                  <button type="button" @click="removeItem(idx)" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Attachments -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="px-5 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            <h3 class="text-sm font-bold text-slate-700">ไฟล์แนบ</h3>
          </div>
          <div class="p-5 space-y-3">
            <label
              class="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-300 rounded-xl py-6 px-6 cursor-pointer hover:border-indigo-300 hover:bg-slate-50 transition-colors"
              @dragover.prevent
              @drop.prevent="onFilesDropped"
            >
              <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              <span class="text-sm text-slate-500">คลิกเพื่อเลือกไฟล์แนบ (รองรับหลายไฟล์)</span>
              <input type="file" multiple class="sr-only" @change="onFilesPicked">
            </label>
            <ul v-if="files.length" class="space-y-2">
              <li v-for="(f, idx) in files" :key="idx" class="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-slate-200 text-sm">
                <span class="truncate text-slate-700">{{ f.name }}</span>
                <span class="flex items-center gap-3 flex-shrink-0">
                  <span class="text-xs text-slate-400">{{ formatSize(f.size) }}</span>
                  <button type="button" @click="removeFile(idx)" class="text-slate-400 hover:text-red-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- RIGHT: summary sidebar -->
      <div class="w-full lg:w-80 lg:flex-shrink-0">
        <div class="lg:sticky lg:top-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-500">ความเร่งด่วน</span>
            <span class="font-bold text-slate-800">{{ priorityLabelText }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-500">จำนวนรายการ</span>
            <span class="font-bold text-slate-800">{{ items.length }}</span>
          </div>
          <button
            @click="submit"
            :disabled="!canSubmit || isSubmitting"
            class="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            {{ isSubmitting ? 'กำลังส่ง...' : 'ส่งคำขอให้ IT' }}
          </button>
          <p v-if="!canSubmit" class="text-xs text-slate-400 text-center">กรุณากรอกแผนก และบันทึกรายการอย่างน้อย 1 รายการก่อนส่งคำขอ</p>
          <p v-if="submitError" class="text-xs text-red-600 text-center">{{ submitError }}</p>
          <button @click="router.back()" class="w-full px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  </RequirePermission>
</template>
