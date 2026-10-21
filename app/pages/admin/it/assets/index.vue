<script setup lang="ts">
definePageMeta({ layout: 'admin', section: 'ทรัพย์สิน', title: 'ภาพรวม' })

import RequirePermission from '~/components/admin/RequirePermission.vue'
import PageHeader from '~/components/admin/PageHeader.vue'

interface CountRow { n: number; StatusID?: number; StatusName?: string; TypeID?: number; TypeName?: string; BranchID?: number; BranchName?: string }

interface SummaryRow {
  AssetID: string
  AssetTag: string
  MachineNumber: string | null
  TypeName: string | null
  StatusName: string | null
  AssignedToName: string | null
  WarrantyEndDate: string | null
}

interface Summary {
  totals: { total: number; unassigned: number; warrantyExpiring: number; warrantyExpired: number; totalValue: number }
  byStatus: CountRow[]
  byType: CountRow[]
  byBranch: CountRow[]
  warrantyExpiring: SummaryRow[]
  attention: SummaryRow[]
}

const { data: summary, error } = await useFetch<Summary>('/api/appsheet-assets/summary')

const ATTENTION = ['ชำรุด', 'ซ่อมบำรุง', 'สูญหาย']
// From the status counts — the attention list itself is capped at 20 rows.
const attentionCount = computed(() =>
  (summary.value?.byStatus || []).filter(s => ATTENTION.includes(s.StatusName || '')).reduce((sum, s) => sum + s.n, 0))
const inUseCount = computed(() => summary.value?.byStatus.find(s => s.StatusName === 'ใช้งานอยู่')?.n || 0)
const total = computed(() => summary.value?.totals.total || 0)
const pct = (n: number) => (total.value ? (n / total.value) * 100 : 0)

// Solid colors for the stacked status bar (pill classes are too light for a bar).
const STATUS_BAR: Record<string, string> = {
  'ใช้งานอยู่': 'bg-emerald-500', 'ชำรุด': 'bg-red-500', 'ซ่อมบำรุง': 'bg-orange-400', 'เลิกใช้งาน': 'bg-slate-400',
  'สูญหาย': 'bg-rose-700', 'สำรอง': 'bg-sky-500', 'คืน': 'bg-amber-400',
}
const statusBar = (name?: string) => (name && STATUS_BAR[name]) || 'bg-slate-300'

// Breakdown cards show the top rows; the rest folds into a "show all" toggle.
const TOP_N = 6
const showAllTypes = ref(false)
const showAllBranches = ref(false)
const types = computed(() => (summary.value?.byType || []).slice(0, showAllTypes.value ? undefined : TOP_N))
const branches = computed(() => (summary.value?.byBranch || []).slice(0, showAllBranches.value ? undefined : TOP_N))
const maxType = computed(() => Math.max(1, ...(summary.value?.byType || []).map(t => t.n)))
const maxBranch = computed(() => Math.max(1, ...(summary.value?.byBranch || []).map(b => b.n)))

const listLink = (query: Record<string, string | number | undefined>) => ({ path: '/admin/it/assets/list', query })
</script>

<template>
  <RequirePermission requiredRole="IT_ADMIN">
    <PageHeader title="ภาพรวมทรัพย์สิน IT" subtitle="ข้อมูลสดจาก AppSheet · ดูอย่างเดียว" color="purple" hero>
      <template #icon>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19V9m6 10V5m6 14v-7m4 7H2" /></svg>
      </template>
      <template #actions>
        <NuxtLink to="/admin/it/assets/list" class="ui-btn-outline">ดูรายการทั้งหมด →</NuxtLink>
      </template>
    </PageHeader>

    <div v-if="error" class="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
      ไม่สามารถโหลดข้อมูลได้: {{ error.data?.statusMessage || error.message }}
    </div>

    <div v-else-if="summary" class="space-y-6">
      <!-- KPIs -->
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <NuxtLink :to="listLink({})" class="kpi-card bg-gradient-to-br from-violet-50 via-white to-white border-violet-100 hover:shadow-violet-100">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">ทรัพย์สินทั้งหมด</span>
            <span class="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/30 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </span>
          </div>
          <div class="text-3xl font-bold text-violet-700 mt-3 tabular-nums">{{ total.toLocaleString() }}</div>
          <div class="text-xs text-slate-400 mt-1">ยังไม่มีผู้ถือ {{ summary.totals.unassigned }} รายการ</div>
        </NuxtLink>
        <NuxtLink :to="listLink({ status_id: 1 })" class="kpi-card bg-gradient-to-br from-emerald-50 via-white to-white border-emerald-100 hover:shadow-emerald-100">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">ใช้งานอยู่</span>
            <span class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            </span>
          </div>
          <div class="text-3xl font-bold text-emerald-600 mt-3 tabular-nums">{{ inUseCount.toLocaleString() }}</div>
          <div class="text-xs text-slate-400 mt-1">{{ Math.round(pct(inUseCount)) }}% ของทั้งหมด</div>
        </NuxtLink>
        <a href="#attention" class="kpi-card bg-gradient-to-br from-rose-50 via-white to-white border-rose-100 hover:shadow-rose-100">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">ต้องติดตาม</span>
            <span class="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-md shadow-rose-500/30 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            </span>
          </div>
          <div class="text-3xl font-bold mt-3 tabular-nums" :class="attentionCount ? 'text-rose-600' : 'text-slate-900'">{{ attentionCount }}</div>
          <div class="text-xs text-slate-400 mt-1">ชำรุด · ซ่อมบำรุง · สูญหาย</div>
        </a>
        <NuxtLink :to="listLink({ warranty: 'expiring' })" class="kpi-card bg-gradient-to-br from-amber-50 via-white to-white border-amber-100 hover:shadow-amber-100">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">ประกันใกล้หมด</span>
            <span class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
          </div>
          <div class="text-3xl font-bold mt-3 tabular-nums" :class="summary.totals.warrantyExpiring ? 'text-amber-600' : 'text-slate-900'">{{ summary.totals.warrantyExpiring }}</div>
          <div class="text-xs text-slate-400 mt-1">ภายใน 90 วัน · หมดแล้ว {{ summary.totals.warrantyExpired }}</div>
        </NuxtLink>
      </div>

      <!-- Status distribution -->
      <div class="ui-card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="ui-card-title">สถานะทรัพย์สิน</h3>
          <span class="text-xs text-slate-400">คลิกเพื่อดูรายการ</span>
        </div>
        <div class="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
          <NuxtLink
            v-for="s in summary.byStatus"
            :key="s.StatusID"
            :to="listLink({ status_id: s.StatusID })"
            :class="statusBar(s.StatusName)"
            :style="{ width: `${pct(s.n)}%` }"
            :title="`${s.StatusName} ${s.n}`"
          />
        </div>
        <div class="flex flex-wrap gap-x-5 gap-y-2 mt-3">
          <NuxtLink
            v-for="s in summary.byStatus"
            :key="s.StatusID"
            :to="listLink({ status_id: s.StatusID })"
            class="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <span class="w-2.5 h-2.5 rounded-full" :class="statusBar(s.StatusName)"></span>
            {{ s.StatusName }}
            <span class="font-semibold text-slate-900 tabular-nums">{{ s.n }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div v-for="block in [
          { title: 'แยกตามประเภท', rows: types, all: summary.byType, max: maxType, key: 'type' },
          { title: 'แยกตามสาขา', rows: branches, all: summary.byBranch, max: maxBranch, key: 'branch' },
        ]" :key="block.key" class="ui-card p-5">
          <h3 class="ui-card-title mb-4">{{ block.title }}</h3>
          <div class="space-y-1">
            <NuxtLink
              v-for="r in block.rows"
              :key="(block.key === 'type' ? r.TypeID : r.BranchID) ?? 'none'"
              :to="listLink(block.key === 'type' ? { type_id: r.TypeID } : { branch_id: r.BranchID })"
              class="grid grid-cols-[9rem_1fr_2.5rem] items-center gap-3 text-sm px-2 py-1.5 -mx-2 rounded-lg hover:bg-slate-50"
            >
              <span class="flex items-center gap-2 text-slate-600 truncate">
                <span class="w-2 h-2 rounded-full flex-shrink-0" :class="paletteFor(block.key === 'type' ? r.TypeName : r.BranchName).solid"></span>
                <span class="truncate">{{ block.key === 'type' ? r.TypeName : r.BranchName }}</span>
              </span>
              <span class="h-2 bg-slate-100 rounded-full overflow-hidden">
                <span class="block h-full rounded-full" :class="paletteFor(block.key === 'type' ? r.TypeName : r.BranchName).solid" :style="{ width: `${r.n / block.max * 100}%` }"></span>
              </span>
              <span class="text-right font-semibold text-slate-800 tabular-nums">{{ r.n }}</span>
            </NuxtLink>
          </div>
          <button
            v-if="block.all.length > TOP_N"
            class="mt-2 text-xs font-medium text-purple-600 hover:text-purple-800"
            @click="block.key === 'type' ? (showAllTypes = !showAllTypes) : (showAllBranches = !showAllBranches)"
          >
            {{ (block.key === 'type' ? showAllTypes : showAllBranches) ? 'แสดงน้อยลง' : `แสดงทั้งหมด (${block.all.length})` }}
          </button>
        </div>
      </div>

      <!-- Follow-up lists -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div id="attention" class="ui-card overflow-hidden scroll-mt-24">
          <div class="flex items-center justify-between px-5 py-4 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white">
            <h3 class="ui-card-title">ต้องติดตาม</h3>
            <span class="ui-pill bg-red-50 text-red-600">{{ attentionCount }}</span>
          </div>
          <ul class="divide-y divide-slate-100">
            <li v-for="a in summary.attention" :key="a.AssetID">
              <NuxtLink :to="`/admin/it/assets/${a.AssetID}`" class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <div class="min-w-0 flex-1">
                  <div class="ui-code">{{ a.MachineNumber || a.AssetTag }}</div>
                  <div class="text-xs text-slate-500 truncate">{{ a.TypeName || '—' }} · {{ a.AssignedToName || 'ไม่มีผู้ถือ' }}</div>
                </div>
                <span class="ui-pill" :class="assetStatusClass(a.StatusName)">{{ a.StatusName }}</span>
              </NuxtLink>
            </li>
            <li v-if="!summary.attention.length" class="px-5 py-8 text-center text-sm text-slate-400">ไม่มีรายการที่ต้องติดตาม</li>
          </ul>
        </div>
        <div class="ui-card overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white">
            <h3 class="ui-card-title">ประกันใกล้หมดใน 90 วัน</h3>
            <NuxtLink :to="listLink({ warranty: 'expiring' })" class="text-xs font-medium text-purple-600 hover:text-purple-800">ดูทั้งหมด →</NuxtLink>
          </div>
          <ul class="divide-y divide-slate-100">
            <li v-for="a in summary.warrantyExpiring" :key="a.AssetID">
              <NuxtLink :to="`/admin/it/assets/${a.AssetID}`" class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <div class="min-w-0 flex-1">
                  <div class="ui-code">{{ a.MachineNumber || a.AssetTag }}</div>
                  <div class="text-xs text-slate-500 truncate">{{ a.TypeName || '—' }} · {{ a.AssignedToName || 'ไม่มีผู้ถือ' }}</div>
                </div>
                <span class="ui-pill bg-amber-50 text-amber-700 ring-1 ring-amber-200">เหลือ {{ warrantyDaysLeft(a.WarrantyEndDate) }} วัน</span>
              </NuxtLink>
            </li>
            <li v-if="!summary.warrantyExpiring.length" class="px-5 py-8 text-center text-sm text-slate-400">ไม่มีรายการ</li>
          </ul>
        </div>
      </div>
    </div>
  </RequirePermission>
</template>
