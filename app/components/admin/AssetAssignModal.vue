<script setup lang="ts">
import Modal from '~/components/admin/Modal.vue'
import { categoryLabel, toStructuredItems, type RequestedItem } from '~/utils/itRequest'

const props = defineProps<{
  request: {
    id: string
    employeeName: string
    requesterName?: string | null
    department?: string | null
    requestedItems: Array<string | RequestedItem>
  }
}>()

const emit = defineEmits<{ close: []; done: [] }>()

const items = computed(() =>
  toStructuredItems(props.request.requestedItems).map(i => ({
    assetName: i.name || categoryLabel(i.category) || '',
    assetTag: '',
    category: i.category,
    quantity: i.quantity
  }))
)

const form = reactive({
  assignedDate: new Date().toISOString().slice(0, 10),
  notes: ''
})

const submitting = ref(false)
const errorMsg = ref('')

async function submit() {
  if (submitting.value) return
  submitting.value = true
  errorMsg.value = ''
  try {
    await $fetch(`/api/it-requests/${props.request.id}/assign`, {
      method: 'POST',
      body: {
        items: items.value,
        assignedDate: form.assignedDate,
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
  <Modal title="บันทึกการส่งมอบทรัพย์สิน" max-width="2xl" @close="$emit('close')">
    <div class="space-y-5">

      <!-- ข้อมูลผู้รับ -->
      <div class="rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <h4 class="text-sm font-bold text-slate-700">ข้อมูลผู้รับมอบ</h4>
        </div>
        <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p class="text-xs text-slate-400 mb-0.5">ชื่อ-นามสกุล</p>
            <p class="text-sm font-medium text-slate-900">{{ request.requesterName || request.employeeName }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-0.5">แผนก / ฝ่าย</p>
            <p class="text-sm font-medium text-slate-900">{{ request.department || '-' }}</p>
          </div>
        </div>
      </div>

      <!-- รายการทรัพย์สิน -->
      <div class="rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          <h4 class="text-sm font-bold text-slate-700">รายการทรัพย์สินที่ส่งมอบ ({{ items.length }})</h4>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/80 text-slate-500 text-xs uppercase border-b border-slate-100">
              <tr>
                <th class="px-4 py-2 font-semibold">หมวด</th>
                <th class="px-4 py-2 font-semibold">ชื่อรายการ</th>
                <th class="px-4 py-2 font-semibold text-center">จำนวน</th>
                <th class="px-4 py-2 font-semibold">Asset Tag</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(item, idx) in items" :key="idx">
                <td class="px-4 py-2.5 text-slate-600 whitespace-nowrap">{{ categoryLabel(item.category) || '-' }}</td>
                <td class="px-4 py-2.5 text-slate-800 font-medium">{{ item.assetName || '-' }}</td>
                <td class="px-4 py-2.5 text-center text-slate-600">{{ item.quantity }}</td>
                <td class="px-4 py-2.5">
                  <input v-model="item.assetTag" type="text" placeholder="ระบุ Tag (ถ้ามี)" class="px-2 py-1 text-xs border border-slate-300 rounded-lg w-full max-w-[160px] focus:outline-none focus:ring-1 focus:ring-purple-500/30" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- วันที่ส่งมอบ + หมายเหตุ -->
      <div class="rounded-xl border border-slate-200 overflow-hidden">
        <div class="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <h4 class="text-sm font-bold text-slate-700">รายละเอียดการส่งมอบ</h4>
        </div>
        <div class="p-4 space-y-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">วันที่ส่งมอบ <span class="text-red-500">*</span></label>
            <input v-model="form.assignedDate" type="date" :class="inputCls" class="!w-auto" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">หมายเหตุ</label>
            <textarea v-model="form.notes" rows="2" placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)" :class="inputCls"></textarea>
          </div>
        </div>
      </div>

      <p v-if="errorMsg" class="text-sm text-red-600 text-center">{{ errorMsg }}</p>
    </div>

    <template #footer>
      <button @click="$emit('close')" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">ยกเลิก</button>
      <button
        @click="submit"
        :disabled="submitting || !form.assignedDate"
        class="px-4 py-2 text-white rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
      >{{ submitting ? 'กำลังบันทึก...' : 'ยืนยันส่งมอบ' }}</button>
    </template>
  </Modal>
</template>
