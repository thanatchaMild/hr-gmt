<script setup lang="ts">
import Modal from '~/components/admin/Modal.vue'
import StatusBadge from '~/components/admin/StatusBadge.vue'
import { priorityLabel, priorityBadgeColor, categoryLabel, toStructuredItems, type RequestedItem } from '~/utils/itRequest'

const props = defineProps<{
  request: {
    id: string
    employeeName: string
    type: string
    status: string
    requestedItems: Array<string | RequestedItem>
    attachments?: { name: string; url: string }[]
    requestType?: string | null
    department?: string | null
    approver?: string | null
    notes?: string | null
    requestedBy?: string | null
    requestFor?: string
    requesterName?: string | null
    requesterEmployeeCode?: string | null
    contactEmail?: string | null
    priority?: string
    neededDate?: string | null
    returnDate?: string | null
    createdAt: string
  }
}>()

defineEmits<{ close: [] }>()

const kindLabel: Record<string, string> = {
  ONBOARDING: 'เตรียมความพร้อมพนักงานใหม่ (Onboarding)',
  OFFBOARDING: 'ปิดสิทธิ์พนักงานลาออก (Offboarding)',
  ASSET_REQUEST: 'คำขอทรัพย์สิน IT'
}

const kindBadge: Record<string, string> = {
  ONBOARDING: 'bg-blue-100 text-blue-700',
  OFFBOARDING: 'bg-red-100 text-red-700',
  ASSET_REQUEST: 'bg-purple-100 text-purple-700'
}

const statusMeta: Record<string, { text: string; color: 'yellow' | 'blue' | 'green' }> = {
  PENDING: { text: 'รอดำเนินการ', color: 'yellow' },
  IN_PROGRESS: { text: 'กำลังดำเนินการ', color: 'blue' },
  COMPLETED: { text: 'ดำเนินการเสร็จสิ้น', color: 'green' }
}

const items = computed(() => toStructuredItems(props.request.requestedItems))
const attachments = computed(() => props.request.attachments || [])
const fmtDate = (d?: string | null) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}

interface HoldingRow {
  id: number
  assetName: string
  assetTag: string | null
  category: string | null
  quantity: number
  status: string
  assignedDate: string | null
  returnedDate: string | null
  returnCondition: string | null
  notes: string | null
  processedBy: string
}

const holdings = ref<HoldingRow[]>([])
const loadingHoldings = ref(false)

const returnConditionLabel: Record<string, string> = {
  GOOD: 'ปกติ',
  DAMAGED: 'ชำรุด',
  LOST: 'สูญหาย'
}

const returnConditionCls: Record<string, string> = {
  GOOD: 'bg-green-100 text-green-700',
  DAMAGED: 'bg-orange-100 text-orange-700',
  LOST: 'bg-red-100 text-red-700'
}

async function loadHoldings() {
  loadingHoldings.value = true
  try {
    const res = await $fetch<{ holdings: HoldingRow[] }>(`/api/it-requests/${props.request.id}/holdings`)
    holdings.value = res.holdings
  } catch {
    holdings.value = []
  } finally {
    loadingHoldings.value = false
  }
}

onMounted(() => { loadHoldings() })
</script>

<template>
  <Modal title="รายละเอียดคำขออุปกรณ์ IT" max-width="2xl" @close="$emit('close')">
    <div class="space-y-5">

      <!-- Header: Status + Type -->
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="kindBadge[request.type] || 'bg-slate-100 text-slate-600'">
          {{ kindLabel[request.type] || request.type }}
        </span>
        <div class="flex items-center gap-2">
          <StatusBadge v-if="request.priority" :text="priorityLabel(request.priority)" :color="priorityBadgeColor(request.priority)" />
          <StatusBadge :text="statusMeta[request.status]?.text || request.status" :color="statusMeta[request.status]?.color || 'yellow'" />
        </div>
      </div>

      <!-- Section: ข้อมูลผู้ขอ -->
      <div class="rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <h4 class="text-sm font-bold text-slate-700">ข้อมูลผู้ขอ</h4>
        </div>
        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p class="text-xs text-slate-400 mb-0.5">ชื่อ-นามสกุล</p>
            <p class="text-sm font-medium text-slate-900">{{ request.requesterName || request.employeeName }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-0.5">รหัสพนักงาน</p>
            <p class="text-sm font-medium text-slate-900">{{ request.requesterEmployeeCode || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-0.5">แผนก / ฝ่าย</p>
            <p class="text-sm font-medium text-slate-900">{{ request.department || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-0.5">อีเมลติดต่อ</p>
            <p class="text-sm font-medium text-slate-900">{{ request.contactEmail || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-0.5">ส่งคำขอโดย (HR)</p>
            <p class="text-sm font-medium text-slate-900">{{ request.requestedBy || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-0.5">ขอให้</p>
            <p class="text-sm font-medium text-slate-900">{{ request.requestFor === 'OTHER' ? 'ขอให้คนอื่น' : 'ขอให้ตัวเอง' }}</p>
          </div>
        </div>
      </div>

      <!-- Section: รายละเอียดคำขอ -->
      <div class="rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <h4 class="text-sm font-bold text-slate-700">รายละเอียดคำขอ</h4>
        </div>
        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p class="text-xs text-slate-400 mb-0.5">ความเร่งด่วน</p>
            <p class="text-sm font-medium text-slate-900">{{ priorityLabel(request.priority) || 'ปกติ' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-0.5">วันที่ส่งคำขอ</p>
            <p class="text-sm font-medium text-slate-900">{{ fmtDate(request.createdAt) }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-0.5">วันที่ต้องการ</p>
            <p class="text-sm font-medium text-slate-900">{{ fmtDate(request.neededDate) }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-0.5">กำหนดคืน</p>
            <p class="text-sm font-medium text-slate-900">{{ fmtDate(request.returnDate) }}</p>
          </div>
        </div>
        <div v-if="request.notes" class="px-4 pb-4">
          <p class="text-xs text-slate-400 mb-1">รายละเอียดเพิ่มเติม</p>
          <p class="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 whitespace-pre-line">{{ request.notes }}</p>
        </div>
      </div>

      <!-- Section: รายการที่ขอ -->
      <div class="rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          <h4 class="text-sm font-bold text-slate-700">รายการที่ขอ ({{ items.length }})</h4>
        </div>
        <div v-if="items.length" class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/80 text-slate-500 text-xs uppercase border-b border-slate-100">
              <tr>
                <th class="px-4 py-2 font-semibold">หมวด</th>
                <th class="px-4 py-2 font-semibold">ชื่อรายการ</th>
                <th class="px-4 py-2 font-semibold text-center">จำนวน</th>
                <th class="px-4 py-2 font-semibold">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(it, idx) in items" :key="idx">
                <td class="px-4 py-2.5 text-slate-600 whitespace-nowrap">{{ categoryLabel(it.category) || '-' }}</td>
                <td class="px-4 py-2.5 text-slate-800 font-medium">{{ it.name || '-' }}</td>
                <td class="px-4 py-2.5 text-center text-slate-600">{{ it.quantity }}</td>
                <td class="px-4 py-2.5 text-slate-500">{{ it.note || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="p-4 text-sm text-slate-400 text-center">ไม่มีรายการ</p>
      </div>

      <!-- Section: ไฟล์แนบ -->
      <div v-if="attachments.length" class="rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          <h4 class="text-sm font-bold text-slate-700">ไฟล์แนบ ({{ attachments.length }})</h4>
        </div>
        <ul class="p-4 space-y-1.5">
          <li v-for="(f, idx) in attachments" :key="idx">
            <a :href="f.url" target="_blank" class="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {{ f.name }}
            </a>
          </li>
        </ul>
      </div>

      <!-- Section: บันทึกการถือครอง / คืนทรัพย์สิน -->
      <div v-if="holdings.length" class="rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h4 class="text-sm font-bold text-slate-700">บันทึกการถือครองทรัพย์สิน ({{ holdings.length }})</h4>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/80 text-slate-500 text-xs uppercase border-b border-slate-100">
              <tr>
                <th class="px-4 py-2 font-semibold">ทรัพย์สิน</th>
                <th class="px-4 py-2 font-semibold">Asset Tag</th>
                <th class="px-4 py-2 font-semibold">สถานะ</th>
                <th class="px-4 py-2 font-semibold">วันที่ส่งมอบ</th>
                <th class="px-4 py-2 font-semibold">วันที่คืน</th>
                <th class="px-4 py-2 font-semibold">สภาพ</th>
                <th class="px-4 py-2 font-semibold">โดย</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="h in holdings" :key="h.id">
                <td class="px-4 py-2.5 text-slate-800 font-medium">{{ h.assetName }}</td>
                <td class="px-4 py-2.5 text-slate-600 font-mono text-xs">{{ h.assetTag || '-' }}</td>
                <td class="px-4 py-2.5">
                  <span
                    class="px-2 py-0.5 rounded-full text-xs font-semibold"
                    :class="h.status === 'RETURNED' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'"
                  >{{ h.status === 'RETURNED' ? 'คืนแล้ว' : 'ถือครองอยู่' }}</span>
                </td>
                <td class="px-4 py-2.5 text-slate-500 whitespace-nowrap">{{ fmtDate(h.assignedDate) }}</td>
                <td class="px-4 py-2.5 text-slate-500 whitespace-nowrap">{{ fmtDate(h.returnedDate) }}</td>
                <td class="px-4 py-2.5">
                  <span
                    v-if="h.returnCondition"
                    class="px-2 py-0.5 rounded-full text-xs font-semibold"
                    :class="returnConditionCls[h.returnCondition] || 'bg-slate-100 text-slate-600'"
                  >{{ returnConditionLabel[h.returnCondition] || h.returnCondition }}</span>
                  <span v-else class="text-xs text-slate-300">-</span>
                </td>
                <td class="px-4 py-2.5 text-slate-600 text-xs">{{ h.processedBy }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else-if="loadingHoldings" class="flex items-center justify-center py-4">
        <div class="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>

    </div>

    <template #footer>
      <button @click="$emit('close')" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">ปิด</button>
    </template>
  </Modal>
</template>
