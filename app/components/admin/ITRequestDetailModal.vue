<script setup lang="ts">
import Modal from '~/components/admin/Modal.vue'
import StatusBadge from '~/components/admin/StatusBadge.vue'

const props = defineProps<{
  request: {
    id: string
    employeeName: string
    type: string
    status: string
    requestedItems: string[]
    requestType?: string | null
    department?: string | null
    approver?: string | null
    notes?: string | null
    requestedBy?: string | null
    createdAt: string
  }
}>()

defineEmits<{ close: [] }>()

const kindLabel: Record<string, string> = {
  ONBOARDING: 'เตรียมความพร้อมพนักงานใหม่ (Onboarding)',
  OFFBOARDING: 'ปิดสิทธิ์พนักงานลาออก (Offboarding)'
}

const statusMeta: Record<string, { text: string; color: 'yellow' | 'blue' | 'green' }> = {
  PENDING: { text: 'รอดำเนินการ', color: 'yellow' },
  IN_PROGRESS: { text: 'กำลังดำเนินการ', color: 'blue' },
  COMPLETED: { text: 'ดำเนินการเสร็จสิ้น', color: 'green' }
}

// The create form folds "start date" into the notes field (no dedicated column), so pull it back out here
// to show it as its own field, matching the create form's layout.
const startDate = computed(() => {
  const m = (props.request.notes || '').match(/^วันเริ่มงาน:\s*(.+)$/m)
  return m ? m[1].trim() : null
})

const additionalNotes = computed(() => (props.request.notes || '').replace(/^วันเริ่มงาน:.*$/m, '').trim())
</script>

<template>
  <Modal title="รายละเอียดคำขออุปกรณ์ IT" max-width="2xl" @close="$emit('close')">
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">พนักงาน / ผู้ใช้งาน (End User)</p>
          <p class="font-bold text-slate-900">{{ request.employeeName }}</p>
        </div>
        <StatusBadge :text="statusMeta[request.status]?.text || request.status" :color="statusMeta[request.status]?.color || 'yellow'" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">ผู้ขอ (Requester)</p>
          <p class="font-medium text-slate-900">{{ request.requestedBy || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">แผนก (Department)</p>
          <p class="font-medium text-slate-900">{{ request.department || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">ผู้อนุมัติ (Approver)</p>
          <p class="font-medium text-slate-900">{{ request.approver || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">วันเริ่มงาน (Start Date)</p>
          <p class="font-medium text-slate-900">{{ startDate || '-' }}</p>
        </div>
      </div>

      <div>
        <p class="text-xs text-slate-400 uppercase tracking-wide mb-2">ประเภทคำขอ</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div v-for="(item, idx) in request.requestedItems" :key="idx"
            class="flex items-center gap-2.5 px-3 py-2 border border-blue-400 bg-blue-50 text-blue-700 font-medium rounded-lg text-sm">
            <svg class="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            {{ item }}
          </div>
        </div>
        <p v-if="!request.requestedItems?.length" class="text-sm text-slate-400">ไม่มีข้อมูล</p>
      </div>

      <div>
        <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">รายละเอียด/หมายเหตุถึงแผนก IT</p>
        <p class="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 min-h-[2.75rem] whitespace-pre-line">{{ additionalNotes || '-' }}</p>
      </div>

      <div class="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
        <span>{{ kindLabel[request.type] || request.type }}</span>
        <span>ส่งคำขอเมื่อ {{ request.createdAt?.slice(0, 10) }}</span>
      </div>
    </div>
  </Modal>
</template>
