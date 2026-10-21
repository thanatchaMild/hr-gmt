<script setup lang="ts">
definePageMeta({ layout: 'admin', section: 'คำขอทรัพย์สิน', title: 'รายการขอทรัพย์สิน (Master)' })

import RequirePermission from '~/components/admin/RequirePermission.vue'
import PageHeader from '~/components/admin/PageHeader.vue'
import EmptyState from '~/components/admin/EmptyState.vue'
import FilterBar from '~/components/admin/FilterBar.vue'

interface CatalogItem {
  id: number
  name: string
  active: boolean
  created_at: string | null
  updated_at: string | null
  created_by_name: string | null
  usage_count: number
}

const { data, error } = await useFetch<{ items: CatalogItem[] }>('/api/asset-catalog')

const search = ref('')
const showInactive = ref(true)

const items = computed(() => (data.value?.items || []).filter(i =>
  (showInactive.value || i.active) && (!search.value || i.name.toLowerCase().includes(search.value.toLowerCase()))))
const activeCount = computed(() => (data.value?.items || []).filter(i => i.active).length)
</script>

<template>
  <RequirePermission requiredRole="IT_ADMIN">
    <PageHeader title="รายการขอทรัพย์สิน (Master)" subtitle="รายการที่ผู้ใช้เลือกได้ตอนสร้างคำขอใน myapp · ดูอย่างเดียว" color="purple" hero>
      <template #icon>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
      </template>
    </PageHeader>

    <div v-if="error" class="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
      ไม่สามารถโหลดข้อมูลจาก myapp ได้: {{ error.data?.statusMessage || error.message }}
    </div>

    <div v-else class="ui-card overflow-hidden">
      <FilterBar v-model:search="search" placeholder="ชื่อรายการ..." :active="!!search || !showInactive" @reset="search = ''; showInactive = true">
        <label class="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-600 cursor-pointer select-none hover:bg-slate-50">
          <input v-model="showInactive" type="checkbox" class="rounded border-slate-300" /> แสดงที่ปิดใช้งาน
        </label>
        <template #end>
          <span class="text-xs text-slate-400 whitespace-nowrap">เปิดใช้งาน {{ activeCount }} / {{ data?.items.length || 0 }}</span>
        </template>
      </FilterBar>

      <div class="overflow-x-auto">
        <table class="ui-table">
          <thead>
            <tr>
              <th>ชื่อรายการ</th>
              <th>สถานะ</th>
              <th class="!text-right">ถูกขอ (ครั้ง)</th>
              <th>สร้างโดย</th>
              <th>แก้ไขล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in items" :key="i.id">
              <td class="font-medium" :class="i.active ? 'text-slate-800' : 'text-slate-400'">{{ i.name }}</td>
              <td>
                <span class="ui-pill" :class="i.active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'">
                  {{ i.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
                </span>
              </td>
              <td class="text-right text-slate-600 tabular-nums">{{ i.usage_count }}</td>
              <td class="text-slate-600">{{ i.created_by_name || '—' }}</td>
              <td class="text-slate-500 whitespace-nowrap">{{ formatThaiDate(i.updated_at || i.created_at) }}</td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="items.length === 0" message="ไม่มีรายการ" />
      </div>
    </div>
  </RequirePermission>
</template>
