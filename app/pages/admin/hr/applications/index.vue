<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
import RequirePermission from '~/components/admin/RequirePermission.vue'
import AppPagination from '~/components/admin/AppPagination.vue'
import PageHeader from '~/components/admin/PageHeader.vue'
import StatusBadge from '~/components/admin/StatusBadge.vue'
import EmptyState from '~/components/admin/EmptyState.vue'
import { DEPARTMENTS } from '~/utils/departments'
import { hireTypeLabel } from '~/utils/hireType'

interface ApplicationRow {
  id: string
  firstName: string
  lastName: string
  employeeType: 'DAILY' | 'MONTHLY'
  hireType: string | null
  status: 'SUBMITTED'
  department: string | null
  createdAt: string
}

// Only applications still awaiting review. Once HR approves one the record
// becomes a current employee (status APPROVED) and belongs in "ข้อมูลพนักงานทั้งหมด".
const { data, refresh } = await useFetch<{ employees: ApplicationRow[] }>('/api/employees', {
  query: { status: 'SUBMITTED', source: 'ONBOARDING' }
})

const applications = computed(() => data.value?.employees || [])

const searchQuery = ref('')
const filterDepartment = ref('')
const filterCreatedAtFrom = ref('')
const filterCreatedAtTo = ref('')

function inRange(dateValue: string | null, from: string, to: string) {
  if (!from && !to) return true
  if (!dateValue) return false
  const d = dateValue.slice(0, 10)
  if (from && d < from) return false
  if (to && d > to) return false
  return true
}

const filteredApplications = computed(() => {
  return applications.value.filter(app => {
    const fullName = `${app.firstName} ${app.lastName}`.toLowerCase()

    if (searchQuery.value && !fullName.includes(searchQuery.value.toLowerCase())) {
      return false
    }
    if (filterDepartment.value && app.department !== filterDepartment.value) {
      return false
    }
    if (!inRange(app.createdAt, filterCreatedAtFrom.value, filterCreatedAtTo.value)) {
      return false
    }
    return true
  })
})

const currentPage = ref(1)

watch([searchQuery, filterDepartment, filterCreatedAtFrom, filterCreatedAtTo], () => {
  currentPage.value = 1
})

const paginatedApplications = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredApplications.value.slice(start, start + 10)
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
            <label class="text-xs font-medium text-slate-500">วันที่ส่งใบสมัคร</label>
            <div class="flex items-center gap-1.5 px-2 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500">
              <input v-model="filterCreatedAtFrom" type="date" class="py-2 text-sm border-none bg-transparent focus:outline-none focus:ring-0 w-[130px]">
              <span class="text-slate-300">–</span>
              <input v-model="filterCreatedAtTo" type="date" class="py-2 text-sm border-none bg-transparent focus:outline-none focus:ring-0 w-[130px]">
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-slate-500">ค้นหา</label>
            <div class="relative">
              <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อผู้สมัคร..." class="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 w-56">
            </div>
          </div>
        </div>
      </div>
      <div class="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-blue-600"></div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-xs">
            <tr>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">ชื่อ-นามสกุล</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">ประเภท</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">วันที่ส่งใบสมัคร</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">สถานะใบสมัคร</th>
              <th class="px-6 py-3 font-semibold text-center whitespace-nowrap">การจัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="app in paginatedApplications" :key="app.id" class="hover:bg-blue-50/30 transition-colors">
              <td class="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                {{ app.firstName }} {{ app.lastName }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <StatusBadge :text="hireTypeLabel(app.hireType ?? app.employeeType)" :color="app.employeeType === 'MONTHLY' ? 'purple' : 'blue'" />
              </td>
              <td class="px-6 py-4 text-slate-600 whitespace-nowrap">{{ app.createdAt?.slice(0, 10) || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <StatusBadge text="รอตรวจสอบ" color="yellow" />
              </td>
              <td class="px-6 py-4 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-2">
                  <NuxtLink :to="`/admin/hr/applications/${app.id}`" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.6a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"></path></svg>
                    ตรวจสอบใบสมัคร
                  </NuxtLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="filteredApplications.length === 0" message="ไม่พบใบสมัครใหม่" />
      </div>
      <AppPagination v-model:currentPage="currentPage" :totalItems="filteredApplications.length" :itemsPerPage="10" />
    </div>
  </RequirePermission>
</template>
