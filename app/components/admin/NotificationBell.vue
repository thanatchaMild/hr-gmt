<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

interface EmployeeAlert {
  id: string
  type: 'PROBATION_WARNING' | 'CONTRACT_WARNING' | 'TENURE_MILESTONE'
  severity?: 'info' | 'warning' | 'urgent' | 'overdue'
  message: string
  employeeId: string
  createdAt: string
}

interface ITRequestAlert {
  id: string
  employeeName: string
  type: 'ONBOARDING' | 'OFFBOARDING' | 'ASSET_REQUEST'
  createdAt: string
}

const authStore = useAuthStore()

const { data: employeeAlertsData } = await useFetch<{ alerts: EmployeeAlert[] }>('/api/alerts', {
  immediate: authStore.isHRAdmin,
  onResponseError: () => {}
})

const { data: itRequestsData } = await useFetch<{ requests: ITRequestAlert[] }>('/api/it-requests', {
  query: { status: 'PENDING' },
  immediate: authStore.isITAdmin,
  onResponseError: () => {}
})

const employeeAlerts = computed(() => employeeAlertsData.value?.alerts || [])
const pendingITRequests = computed(() => itRequestsData.value?.requests || [])
const alertCount = computed(() => authStore.isITAdmin ? pendingITRequests.value.length : employeeAlerts.value.length)

const isOpen = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const toggle = () => {
  isOpen.value = !isOpen.value
}

const handleClickOutside = (e: MouseEvent) => {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

const alertMeta = (alert: EmployeeAlert) => {
  if (alert.type === 'TENURE_MILESTONE') {
    return { color: 'text-indigo-600 bg-indigo-50', label: 'อายุงานครบกำหนด' }
  }
  const baseLabel = alert.type === 'PROBATION_WARNING' ? 'ทดลองงาน' : 'สัญญาจ้าง'
  if (alert.severity === 'overdue') return { color: 'text-rose-700 bg-rose-100', label: `${baseLabel} • เลยกำหนด` }
  if (alert.severity === 'urgent') return { color: 'text-rose-600 bg-rose-50', label: `${baseLabel} • เร่งด่วน` }
  if (alert.severity === 'warning') return { color: 'text-amber-600 bg-amber-50', label: `${baseLabel} • ใกล้ครบ` }
  return { color: 'text-slate-600 bg-slate-100', label: `${baseLabel} • แจ้งล่วงหน้า` }
}

const itRequestMeta = (type: ITRequestAlert['type']) => {
  if (type === 'OFFBOARDING') {
    return { color: 'text-rose-600 bg-rose-50', label: 'คำขอปิดสิทธิ์ (Offboarding)' }
  }
  if (type === 'ONBOARDING') {
    return { color: 'text-purple-600 bg-purple-50', label: 'คำขออุปกรณ์พนักงานใหม่' }
  }
  return { color: 'text-purple-600 bg-purple-50', label: 'คำขอทรัพย์สิน IT' }
}
</script>

<template>
  <div v-if="authStore.isHRAdmin || authStore.isITAdmin" ref="rootEl" class="relative">
    <button @click="toggle" class="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
      <span v-if="alertCount > 0" class="absolute top-1 right-1 flex h-4 w-4">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] font-bold items-center justify-center">{{ alertCount > 9 ? '9+' : alertCount }}</span>
      </span>
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isOpen" class="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 origin-top-right">
        <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h4 class="font-bold text-slate-800 text-sm">การแจ้งเตือน</h4>
          <span class="text-xs text-slate-400">{{ alertCount }} รายการ</span>
        </div>

        <!-- HR alerts: probation / contract warnings -->
        <div v-if="authStore.isHRAdmin" class="max-h-80 overflow-y-auto divide-y divide-slate-50">
          <NuxtLink
            v-for="alert in employeeAlerts"
            :key="alert.id"
            :to="`/admin/hr/employees/${alert.employeeId}`"
            @click="isOpen = false"
            class="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <span class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" :class="alertMeta(alert).color">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </span>
            <div class="min-w-0">
              <p class="text-xs font-semibold" :class="alertMeta(alert).color.split(' ')[0]">{{ alertMeta(alert).label }}</p>
              <p class="text-sm text-slate-700 mt-0.5 leading-snug">{{ alert.message }}</p>
            </div>
          </NuxtLink>
          <div v-if="employeeAlerts.length === 0" class="px-4 py-8 text-center text-sm text-slate-400">
            ไม่มีการแจ้งเตือนในขณะนี้
          </div>
        </div>

        <!-- IT alerts: pending IT requests -->
        <div v-else-if="authStore.isITAdmin" class="max-h-80 overflow-y-auto divide-y divide-slate-50">
          <NuxtLink
            v-for="req in pendingITRequests"
            :key="req.id"
            to="/admin/it/requests"
            @click="isOpen = false"
            class="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
          >
            <span class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" :class="itRequestMeta(req.type).color">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </span>
            <div class="min-w-0">
              <p class="text-xs font-semibold" :class="itRequestMeta(req.type).color.split(' ')[0]">{{ itRequestMeta(req.type).label }}</p>
              <p class="text-sm text-slate-700 mt-0.5 leading-snug">{{ req.employeeName }}</p>
            </div>
          </NuxtLink>
          <div v-if="pendingITRequests.length === 0" class="px-4 py-8 text-center text-sm text-slate-400">
            ไม่มีการแจ้งเตือนในขณะนี้
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
