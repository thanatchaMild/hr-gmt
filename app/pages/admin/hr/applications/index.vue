<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
import RequirePermission from '~/components/admin/RequirePermission.vue'
import PageHeader from '~/components/admin/PageHeader.vue'
import StatusBadge from '~/components/admin/StatusBadge.vue'
import EmptyState from '~/components/admin/EmptyState.vue'
import { DEPARTMENTS } from '~/utils/departments'
import { BRANCHES } from '~/utils/branches'

interface ApplicationRow {
  id: string
  firstName: string
  lastName: string
  employeeType: 'DAILY' | 'MONTHLY'
  status: string
  department: string | null
  branch: string | null
  startDate: string | null
  probationDate: string | null
}

const { data, refresh } = await useFetch<{ employees: ApplicationRow[] }>('/api/employees', {
  query: { status: 'SUBMITTED' }
})

const applications = computed(() => data.value?.employees || [])

const searchQuery = ref('')
const filterDepartment = ref('')
const filterBranch = ref('')
const filterStartDate = ref('')
const filterProbationDate = ref('')

const filteredApplications = computed(() => {
  return applications.value.filter(app => {
    const fullName = `${app.firstName} ${app.lastName}`.toLowerCase()

    if (searchQuery.value && !fullName.includes(searchQuery.value.toLowerCase())) {
      return false
    }
    if (filterDepartment.value && app.department !== filterDepartment.value) {
      return false
    }
    if (filterBranch.value && app.branch !== filterBranch.value) {
      return false
    }
    if (filterStartDate.value && app.startDate?.slice(0, 10) !== filterStartDate.value) {
      return false
    }
    if (filterProbationDate.value && app.probationDate?.slice(0, 10) !== filterProbationDate.value) {
      return false
    }
    return true
  })
})

</script>

<template>
  <RequirePermission requiredRole="HR_ADMIN">
    <PageHeader title="ใบสมัครใหม่ (Onboarding)" subtitle="รายการข้อมูลพนักงานใหม่ที่ส่งเข้ามา" color="blue">
      <template #icon>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
      </template>
    </PageHeader>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 relative">
      <div class="p-6 border-b border-slate-200 flex flex-wrap items-center gap-3">
        <select v-model="filterDepartment" class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
          <option value="">ทุกแผนก</option>
          <option v-for="dept in DEPARTMENTS" :key="dept" :value="dept">{{ dept }}</option>
        </select>
        <select v-model="filterBranch" class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
          <option value="">ทุกสาขา</option>
          <option v-for="branch in BRANCHES" :key="branch" :value="branch">{{ branch }}</option>
        </select>
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-500">เริ่มงาน:</span>
          <input v-model="filterStartDate" type="date" class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-500">ผ่านโปร:</span>
          <input v-model="filterProbationDate" type="date" class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
        </div>
        <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อผู้สมัคร..." class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ml-auto">
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-xs">
            <tr>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">ชื่อ-นามสกุล</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">ประเภท</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">วันที่เริ่มงาน</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">วันที่ผ่านโปร</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">แผนก</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">สาขา</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">สถานะ</th>
              <th class="px-6 py-3 font-semibold text-right whitespace-nowrap">การจัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="app in filteredApplications" :key="app.id" class="hover:bg-blue-50/30 transition-colors">
              <td class="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                {{ app.firstName }} {{ app.lastName }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <StatusBadge :text="app.employeeType === 'MONTHLY' ? 'รายเดือน' : 'รายวัน'" :color="app.employeeType === 'MONTHLY' ? 'purple' : 'blue'" />
              </td>
              <td class="px-6 py-4 text-slate-600 whitespace-nowrap">{{ app.startDate?.slice(0, 10) || '-' }}</td>
              <td class="px-6 py-4 text-slate-600 whitespace-nowrap">{{ app.probationDate?.slice(0, 10) || '-' }}</td>
              <td class="px-6 py-4 text-slate-600 whitespace-nowrap">{{ app.department || '-' }}</td>
              <td class="px-6 py-4 text-slate-600 whitespace-nowrap">{{ app.branch || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <StatusBadge text="รอตรวจสอบ" color="yellow" />
              </td>
              <td class="px-6 py-4 text-right whitespace-nowrap">
                <NuxtLink :to="`/admin/hr/applications/${app.id}`" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.6a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"></path></svg>
                  ตรวจสอบใบสมัคร
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="filteredApplications.length === 0" message="ไม่พบใบสมัครใหม่" />
      </div>
    </div>
  </RequirePermission>
</template>
