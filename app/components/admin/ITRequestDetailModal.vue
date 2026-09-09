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

const statusMeta: Record<string, { text: string; color: 'yellow' | 'blue' | 'green' }> = {
  PENDING: { text: 'รอดำเนินการ', color: 'yellow' },
  IN_PROGRESS: { text: 'กำลังดำเนินการ', color: 'blue' },
  COMPLETED: { text: 'ดำเนินการเสร็จสิ้น', color: 'green' }
}

const items = computed(() => toStructuredItems(props.request.requestedItems))
const attachments = computed(() => props.request.attachments || [])
const fmtDate = (d?: string | null) => (d ? d.slice(0, 10) : '-')
</script>

<template>
  <Modal title="รายละเอียดคำขออุปกรณ์ IT" max-width="2xl" @close="$emit('close')">
    <div class="space-y-5">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">ผู้ขอ / ผู้ใช้งาน</p>
          <p class="font-bold text-slate-900">{{ request.requesterName || request.employeeName }}</p>
        </div>
        <div class="flex items-center gap-2">
          <StatusBadge v-if="request.priority" :text="`ความเร่งด่วน: ${priorityLabel(request.priority)}`" :color="priorityBadgeColor(request.priority)" />
          <StatusBadge :text="statusMeta[request.status]?.text || request.status" :color="statusMeta[request.status]?.color || 'yellow'" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">ส่งคำขอโดย (HR)</p>
          <p class="font-medium text-slate-900">{{ request.requestedBy || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">แผนก / ฝ่าย</p>
          <p class="font-medium text-slate-900">{{ request.department || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">รหัสพนักงาน</p>
          <p class="font-medium text-slate-900">{{ request.requesterEmployeeCode || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">อีเมลติดต่อ</p>
          <p class="font-medium text-slate-900">{{ request.contactEmail || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">วันที่ต้องการ</p>
          <p class="font-medium text-slate-900">{{ fmtDate(request.neededDate) }}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">กำหนดคืน</p>
          <p class="font-medium text-slate-900">{{ fmtDate(request.returnDate) }}</p>
        </div>
      </div>

      <div>
        <p class="text-xs text-slate-400 uppercase tracking-wide mb-2">รายการที่ขอ</p>
        <div v-if="items.length" class="overflow-x-auto border border-slate-200 rounded-lg">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th class="px-3 py-2 font-semibold">หมวด</th>
                <th class="px-3 py-2 font-semibold">ชื่อรายการ</th>
                <th class="px-3 py-2 font-semibold text-center">จำนวน</th>
                <th class="px-3 py-2 font-semibold">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(it, idx) in items" :key="idx">
                <td class="px-3 py-2 text-slate-600 whitespace-nowrap">{{ categoryLabel(it.category) || '-' }}</td>
                <td class="px-3 py-2 text-slate-800">{{ it.name || '-' }}</td>
                <td class="px-3 py-2 text-center text-slate-600">{{ it.quantity }}</td>
                <td class="px-3 py-2 text-slate-600">{{ it.note || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-slate-400">ไม่มีข้อมูล</p>
      </div>

      <div v-if="attachments.length">
        <p class="text-xs text-slate-400 uppercase tracking-wide mb-2">ไฟล์แนบ</p>
        <ul class="space-y-1.5">
          <li v-for="(f, idx) in attachments" :key="idx">
            <a :href="f.url" target="_blank" class="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
              {{ f.name }}
            </a>
          </li>
        </ul>
      </div>

      <div>
        <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">รายละเอียดเพิ่มเติม</p>
        <p class="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 min-h-[2.75rem] whitespace-pre-line">{{ request.notes || '-' }}</p>
      </div>

      <div class="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
        <span>{{ kindLabel[request.type] || request.type }}</span>
        <span>ส่งคำขอเมื่อ {{ request.createdAt?.slice(0, 10) }}</span>
      </div>
    </div>
  </Modal>
</template>
