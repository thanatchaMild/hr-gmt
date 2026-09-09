<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
import RequirePermission from '~/components/admin/RequirePermission.vue'
import EmployeeProfileTabs from '~/components/admin/EmployeeProfileTabs.vue'
import { DEPARTMENTS } from '~/utils/departments'
import { BRANCHES } from '~/utils/branches'
import { hireTypeLabel, hireTypeDateField } from '~/utils/hireType'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const applicationId = route.params.id as string

const { data, refresh } = await useFetch<any>(`/api/employees/${applicationId}`)

const application = computed(() => data.value)

const hrData = reactive({
  employeeCode: '',
  department: '',
  branch: '',
  manager: '',
  startDate: '',
  probationDate: '',
  contractEndDate: ''
})

watch(application, (val) => {
  if (!val) return
  hrData.employeeCode = val.employeeCode || ''
  hrData.department = val.department || ''
  hrData.branch = val.branch || ''
  hrData.manager = val.managerName || ''
  hrData.startDate = val.startDate?.slice(0, 10) || ''
  hrData.probationDate = val.probationDate?.slice(0, 10) || ''
  hrData.contractEndDate = val.contractEndDate?.slice(0, 10) || ''
}, { immediate: true })

const isHrDataSaved = ref(false)
const isSaving = ref(false)

const dateField = computed(() => hireTypeDateField(application.value?.hireType ?? application.value?.employeeType))

// Toast แจ้งเตือนแบบ in-app แทน alert() ของ browser
const toast = reactive<{ show: boolean; message: string; type: 'success' | 'error' }>({
  show: false,
  message: '',
  type: 'success'
})
let toastTimer: ReturnType<typeof setTimeout> | undefined

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.message = message
  toast.type = type
  toast.show = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.show = false }, 3500)
}

onBeforeUnmount(() => { if (toastTimer) clearTimeout(toastTimer) })

const saveHrData = async () => {
  if (!application.value) return

  isSaving.value = true
  try {
    await $fetch(`/api/employees/${applicationId}`, {
      method: 'PATCH',
      body: {
        employeeCode: hrData.employeeCode,
        department: hrData.department,
        branch: hrData.branch,
        managerName: hrData.manager,
        startDate: hrData.startDate,
        probationDate: dateField.value === 'probation' ? hrData.probationDate : undefined,
        contractEndDate: dateField.value === 'contract' ? hrData.contractEndDate : undefined,
        status: 'APPROVED'
      }
    })
    isHrDataSaved.value = true
    await refresh()
    showToast('บันทึกข้อมูลพนักงานเรียบร้อยแล้ว', 'success')
  } catch {
    showToast('บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error')
  } finally {
    isSaving.value = false
  }
}

</script>

<template>
  <RequirePermission requiredRole="HR_ADMIN">
    <div v-if="!application" class="flex justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    </div>
    <div v-else class="max-w-4xl mx-auto space-y-5 relative">
      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-4">
          <button @click="router.back()" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md">
              {{ application.firstName?.[0] }}
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-800">{{ application.firstName }} {{ application.lastName }}</h2>
              <p class="text-sm text-slate-500 mt-0.5">
                {{ hireTypeLabel(application.hireType ?? application.employeeType) }} · ส่งใบสมัครเมื่อ {{ application.createdAt?.slice(0, 10) }}
              </p>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <NuxtLink :to="`/admin/hr/applications/preview/${applicationId}`" target="_blank" class="px-4 py-2 bg-blue-600 border border-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            ดูใบสมัครงาน
          </NuxtLink>
          <NuxtLink :to="`/admin/hr/it-requests/new?employeeId=${applicationId}`" class="px-4 py-2 bg-purple-600 border border-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 shadow-sm flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            ขออุปกรณ์ IT
          </NuxtLink>
        </div>
      </div>

      <!-- Compact context strip: just enough space for what it actually holds -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-3 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
        <div class="flex items-center gap-2 text-slate-500">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          {{ application.email }}
        </div>
        <div class="flex items-center gap-2 text-slate-500">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          {{ application.phone }}
        </div>
      </div>

      <!-- Priority 1: the actual HR task on this page -->
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-indigo-100 p-6">
        <div class="flex justify-between items-center mb-4 border-b border-indigo-200 pb-3">
          <h3 class="text-lg font-bold text-blue-900 flex items-center gap-2">
            <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.6a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"></path></svg>
            จัดการข้อมูลพนักงาน (เฉพาะ HR)
          </h3>
          <span v-if="isHrDataSaved || application.status === 'APPROVED'" class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 flex-shrink-0">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
            บันทึกแล้ว
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">รหัสพนักงาน</label>
            <input v-model="hrData.employeeCode" type="text" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none" placeholder="ระบุรหัสพนักงาน...">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">แผนก</label>
            <select v-model="hrData.department" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none">
              <option value="" disabled>-- เลือกแผนก --</option>
              <option v-for="dept in DEPARTMENTS" :key="dept" :value="dept">{{ dept }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">สาขา</label>
            <select v-model="hrData.branch" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none">
              <option value="" disabled>-- เลือกสาขา --</option>
              <option v-for="branch in BRANCHES" :key="branch" :value="branch">{{ branch }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">หัวหน้างาน</label>
            <input v-model="hrData.manager" type="text" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none" placeholder="ระบุชื่อหัวหน้า...">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">เริ่มงาน</label>
            <input v-model="hrData.startDate" type="date" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none">
          </div>
          <div v-if="dateField === 'probation'">
            <label class="block text-sm font-medium text-slate-700 mb-1">ผ่านทดลองงาน</label>
            <input v-model="hrData.probationDate" type="date" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none">
          </div>
          <div v-else-if="dateField === 'contract'">
            <label class="block text-sm font-medium text-slate-700 mb-1">วันหมดสัญญา</label>
            <input v-model="hrData.contractEndDate" type="date" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none">
          </div>
        </div>

        <div class="mt-4 flex justify-end">
          <button @click="saveHrData" :disabled="isSaving" class="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {{ isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลและยืนยัน' }}
          </button>
        </div>
      </div>

      <!-- Priority 2: full applicant profile, editable inline -->
      <EmployeeProfileTabs
        :form-data="application.formData"
        :documents="application.documents"
        :it-requests="application.itRequests"
        :employee="application"
        editable
        @saved="refresh"
      />
    </div>

    <!-- Toast แจ้งเตือน -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-3 sm:translate-y-0 sm:translate-x-3"
        enter-to-class="opacity-100 translate-y-0 sm:translate-x-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 sm:translate-x-0"
        leave-to-class="opacity-0 translate-y-3 sm:translate-y-0 sm:translate-x-3"
      >
        <div
          v-if="toast.show"
          class="fixed z-[60] bottom-5 right-5 left-5 sm:left-auto sm:max-w-sm"
        >
          <div
            class="flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg"
            :class="toast.type === 'success' ? 'border-green-200' : 'border-red-200'"
          >
            <div
              class="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
              :class="toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
            >
              <svg v-if="toast.type === 'success'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
              <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path></svg>
            </div>
            <p class="flex-1 pt-0.5 text-sm font-medium text-slate-700">{{ toast.message }}</p>
            <button
              @click="toast.show = false"
              class="mt-0.5 flex-shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </RequirePermission>
</template>
