<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
import { useAuthStore } from '~/stores/auth'
import StatCard from '~/components/admin/StatCard.vue'

const authStore = useAuthStore()

const { data: applicationsData } = await useFetch<{ employees: unknown[] }>('/api/employees', {
  query: { status: 'SUBMITTED' }
})
const { data: itRequestsData } = await useFetch<{ requests: unknown[] }>('/api/it-requests', {
  query: { status: 'PENDING' }
})
const { data: alertsData } = await useFetch<{ alerts: unknown[] }>('/api/alerts', {
  immediate: authStore.isHRAdmin
})

const pendingApplicationsCount = computed(() => applicationsData.value?.employees.length ?? 0)
const pendingITRequestsCount = computed(() => itRequestsData.value?.requests.length ?? 0)
const upcomingAlertsCount = computed(() => alertsData.value?.alerts.length ?? 0)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'สวัสดีตอนเช้า'
  if (hour < 17) return 'สวัสดีตอนบ่าย'
  return 'สวัสดีตอนเย็น'
})
</script>

<template>
  <div>
    <div class="mb-8">
      <p class="text-sm font-medium text-blue-600 mb-1">{{ greeting }}</p>
      <h2 class="text-3xl font-extrabold text-slate-800 tracking-tight">{{ authStore.user?.name }}</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        v-if="authStore.isHRAdmin"
        label="รอการตรวจสอบ"
        :value="pendingApplicationsCount"
        color="blue"
        to="/admin/hr/applications"
        action-text="ดูใบสมัครทั้งหมด"
      >
        <template #icon>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
        </template>
      </StatCard>

      <StatCard
        label="คำขอ IT (ใหม่)"
        :value="pendingITRequestsCount"
        color="purple"
        :to="authStore.isITAdmin ? '/admin/it/requests' : '/admin/hr/it-requests'"
        action-text="จัดการคำขอ"
      >
        <template #icon>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </template>
      </StatCard>

      <StatCard
        v-if="authStore.isHRAdmin"
        label="ใกล้ครบกำหนดทดลองงาน/สัญญา"
        :value="upcomingAlertsCount"
        color="rose"
        to="/admin/hr/employees"
        action-text="ตรวจสอบพนักงาน"
      >
        <template #icon>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </template>
      </StatCard>
    </div>
  </div>
</template>
