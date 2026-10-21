<script setup lang="ts">
import Modal from '~/components/admin/Modal.vue'
import { categoryLabel, toStructuredItems, type RequestedItem } from '~/utils/itRequest'

const props = defineProps<{
  request: {
    id: string
    employeeName: string
    requesterName?: string | null
    requesterEmployeeCode?: string | null
    department?: string | null
    contactEmail?: string | null
    requestedItems: Array<string | RequestedItem>
  }
}>()

const emit = defineEmits<{ close: []; done: [] }>()

const RETURN_CONDITIONS = [
  { code: 'GOOD', label: 'ปกติ', cls: 'border-green-400 bg-green-50 text-green-700' },
  { code: 'DAMAGED', label: 'ชำรุด', cls: 'border-orange-400 bg-orange-50 text-orange-700' },
  { code: 'LOST', label: 'สูญหาย', cls: 'border-red-400 bg-red-50 text-red-700' }
]

const items = computed(() =>
  toStructuredItems(props.request.requestedItems).map(i => ({
    assetName: i.name || categoryLabel(i.category) || '',
    assetTag: '',
    category: i.category,
    quantity: i.quantity,
    returnCondition: 'GOOD'
  }))
)

const form = reactive({
  returnedDate: new Date().toISOString().slice(0, 10),
  notes: ''
})

const submitting = ref(false)
const errorMsg = ref('')

async function submit() {
  if (submitting.value) return
  submitting.value = true
  errorMsg.value = ''
  try {
    await $fetch(`/api/it-requests/${props.request.id}/return`, {
      method: 'POST',
      body: {
        items: items.value,
        returnedDate: form.returnedDate,
        notes: form.notes || undefined
      }
    })
    emit('done')
    emit('close')
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'บันทึกไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    submitting.value = false
  }
}

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500'
</script>

<template>
  <Modal title="บันทึกการรับคืนอุปกรณ์" max-width="2xl" @close="$emit('close')">
    <div class="space-y-5">

      <!-- ข้อมูลผู้คืน -->
      <div class="rounded-xl border border-red-200 overflow-hidden">
        <div class="px-4 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <h4 class="text-sm font-bold text-red-700">ข้อมูลผู้คืนอุปกรณ์</h4>
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
        </div>
      </div>

      <!-- รายการทรัพย์สินที่คืน + สภาพ -->
      <div class="rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          <h4 class="text-sm font-bold text-slate-700">รายการทรัพย์สินที่คืน ({{ items.length }})</h4>
        </div>
        <div class="p-4 space-y-3">
          <div v-for="(item, idx) in items" :key="idx" class="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
            <div class="flex items-center justify-between mb-2">
              <div>
                <span class="text-sm font-medium text-slate-800">{{ item.assetName || '-' }}</span>
                <span v-if="categoryLabel(item.category)" class="text-xs text-slate-400 ml-2">({{ categoryLabel(item.category) }})</span>
              </div>
              <span class="text-xs text-slate-500">จำนวน: {{ item.quantity }}</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-slate-400 mb-1">Asset Tag</label>
                <input v-model="item.assetTag" type="text" placeholder="ระบุ Tag (ถ้ามี)" class="px-2 py-1.5 text-sm border border-slate-300 rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
              </div>
              <div>
                <label class="block text-xs text-slate-400 mb-1">สภาพการคืน <span class="text-red-500">*</span></label>
                <div class="flex gap-1.5">
                  <button
                    v-for="c in RETURN_CONDITIONS"
                    :key="c.code"
                    type="button"
                    @click="item.returnCondition = c.code"
                    class="flex-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                    :class="item.returnCondition === c.code ? c.cls : 'border-slate-300 text-slate-500 hover:bg-slate-50'"
                  >{{ c.label }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- วันที่รับคืน + หมายเหตุ -->
      <div class="rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <h4 class="text-sm font-bold text-slate-700">รายละเอียดการรับคืน</h4>
        </div>
        <div class="p-4 space-y-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">วันที่รับคืน <span class="text-red-500">*</span></label>
            <input v-model="form.returnedDate" type="date" :class="inputCls" class="!w-auto" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">หมายเหตุ</label>
            <textarea v-model="form.notes" rows="2" placeholder="ระบุหมายเหตุเพิ่มเติม เช่น มีรอยขีดข่วน, ขาดอะแดปเตอร์ ฯลฯ" :class="inputCls"></textarea>
          </div>
        </div>
      </div>

      <p v-if="errorMsg" class="text-sm text-red-600 text-center">{{ errorMsg }}</p>
    </div>

    <template #footer>
      <button @click="$emit('close')" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">ยกเลิก</button>
      <button
        @click="submit"
        :disabled="submitting || !form.returnedDate"
        class="px-4 py-2 text-white rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
      >{{ submitting ? 'กำลังบันทึก...' : 'ยืนยันรับคืนอุปกรณ์' }}</button>
    </template>
  </Modal>
</template>
