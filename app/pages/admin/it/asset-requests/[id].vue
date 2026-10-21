<script setup lang="ts">
definePageMeta({ layout: 'admin', section: 'คำขอทรัพย์สิน', title: 'รายละเอียดคำขอ' })

import RequirePermission from '~/components/admin/RequirePermission.vue'

const route = useRoute()
const router = useRouter()

const { data, error, refresh, status } = await useFetch<any>(() => `/api/asset-requests/${route.params.id}`)

const header = computed(() => data.value?.header)
const lines = computed<any[]>(() => data.value?.lines || [])
const memo = computed(() => data.value?.memo)
const linkedAssets = computed<Record<string, any>>(() => data.value?.linkedAssets || {})
const attachments = computed<any[]>(() => data.value?.attachments || [])

const totalBudget = computed(() =>
  lines.value.reduce((sum, l) => sum + (Number(l.unit_price) > 0 ? Number(l.unit_price) * (l.quantity || 1) : 0), 0))

const signatures = computed(() => {
  const h = header.value
  if (!h) return []
  return [
    { role: 'ผู้ขอ', name: h.requester_sig_name, at: h.requester_sig_at, img: h.requester_sig },
    { role: 'หัวหน้างาน', name: h.supervisor_sig_name, at: h.supervisor_sig_at, img: h.supervisor_sig },
    { role: 'IT', name: h.it_sig_name, at: h.it_sig_at, img: h.it_sig },
    { role: 'CTO', name: h.cto_sig_name, at: h.cto_sig_at, img: h.cto_sig },
  ]
})

// Signatures are stored as data URLs (base64 PNG); anything else isn't rendered as an image.
const isImage = (v: unknown) => typeof v === 'string' && v.startsWith('data:image')

function goBack() {
  if (window.history.state?.back) router.back()
  else router.push('/admin/it/asset-requests')
}

function attachmentUrl(a: any) {
  return a.google_view_url || a.google_download_url || null
}

const categoryLabel: Record<string, string> = { signed_memo: 'MEMO ที่เซ็นแล้ว' }
</script>

<template>
  <RequirePermission requiredRole="IT_ADMIN">
    <div class="relative overflow-hidden flex items-start gap-4 mb-6 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-5 py-5 sm:px-7 text-white shadow-lg shadow-purple-500/25">
      <div class="pointer-events-none absolute -right-10 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl"></div>
      <button @click="goBack" class="relative w-9 h-9 rounded-lg bg-white/15 ring-1 ring-white/25 hover:bg-white/25 flex items-center justify-center flex-shrink-0" aria-label="ย้อนกลับ">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div class="relative min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight font-mono">{{ header ? (header.doc_no || `#${header.id}`) : error ? 'คำขอทรัพย์สิน' : 'กำลังโหลด...' }}</h2>
          <span v-if="header" class="ui-pill" :class="requestStatusClass(header.status)">{{ header.status }}</span>
          <span v-if="header?.priority && header.priority !== 'ปกติ'" class="ui-pill" :class="priorityClass(header.priority)">{{ header.priority }}</span>
        </div>
        <p class="text-sm text-white/75 mt-1">{{ header?.request_type }}</p>
      </div>
    </div>

    <div v-if="status === 'pending'" class="flex items-center justify-center py-20">
      <div class="w-7 h-7 border-[3px] border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
    </div>

    <div v-else-if="error" class="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
      {{ error.data?.statusMessage || error.statusMessage || 'ไม่สามารถโหลดข้อมูลได้' }}
      <button @click="() => refresh()" class="ml-3 underline hover:no-underline">ลองใหม่</button>
    </div>

    <div v-else-if="header" class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 space-y-6">
        <!-- Request info -->
        <div class="ui-card p-6">
          <h3 class="ui-card-title mb-5">ข้อมูลคำขอ</h3>
          <dl class="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
            <div><dt class="ui-label">แผนก</dt><dd class="ui-value">{{ header.department || '-' }}</dd></div>
            <div><dt class="ui-label">ผู้ใช้งาน</dt><dd class="ui-value">{{ header.requested_for_name || '-' }}</dd></div>
            <div><dt class="ui-label">รหัสพนักงาน</dt><dd class="ui-value">{{ header.emp_code || header.requester_employee_code || '-' }}</dd></div>
            <div><dt class="ui-label">อีเมลติดต่อ</dt><dd class="ui-value">{{ header.contact_email || '-' }}</dd></div>
            <div><dt class="ui-label">เบอร์ติดต่อ</dt><dd class="ui-value">{{ header.contact_phone || '-' }}</dd></div>
            <div><dt class="ui-label">ผู้สร้างคำขอ</dt><dd class="ui-value">{{ header.creator_name || '-' }}</dd></div>
            <div><dt class="ui-label">วันที่สร้าง</dt><dd class="ui-value">{{ formatThaiDate(header.created_at) }}</dd></div>
            <div><dt class="ui-label">วันที่ต้องการ</dt><dd class="ui-value">{{ formatThaiDate(header.needed_date) }}</dd></div>
            <div v-if="header.borrow_due_date" ><dt class="ui-label">กำหนดคืน</dt><dd class="ui-value">{{ formatThaiDate(header.borrow_due_date) }}</dd></div>
          </dl>
          <div v-if="header.purpose || header.remark" class="mt-4 pt-4 border-t border-slate-100 text-sm space-y-2">
            <p v-if="header.purpose"><span class="text-slate-500">วัตถุประสงค์:</span> <span class="text-slate-700 whitespace-pre-line">{{ header.purpose }}</span></p>
            <p v-if="header.remark"><span class="text-slate-500">หมายเหตุ:</span> <span class="text-slate-700 whitespace-pre-line">{{ header.remark }}</span></p>
          </div>
        </div>

        <!-- Lines -->
        <div class="ui-card overflow-hidden">
          <div class="flex items-center justify-between p-6 pb-3">
            <h3 class="ui-card-title">รายการทรัพย์สิน ({{ lines.length }})</h3>
            <span v-if="totalBudget" class="text-sm text-slate-500">รวมประมาณการ <b class="text-slate-800">{{ formatBaht(totalBudget) }}</b> บาท</span>
          </div>
          <div class="overflow-x-auto">
            <table class="ui-table">
              <thead>
                <tr>
                  <th>รายการ</th>
                  <th class="!text-right">ราคา/หน่วย</th>
                  <th>ผลพิจารณา IT</th>
                  <th>ทรัพย์สินที่ผูก</th>
                  <th>การจัดสรร</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="l in lines" :key="l.id" class="[&>td]:align-top">
                  <td class="">
                    <div class="font-medium text-slate-800">{{ l.item_name }} <span class="text-slate-400 font-normal">× {{ l.quantity }}</span></div>
                    <div v-if="l.catalog_item_name && l.catalog_item_name !== l.item_name" class="text-xs text-slate-400">{{ l.catalog_item_name }}</div>
                    <ul class="mt-1 space-y-0.5">
                      <li v-for="f in lineFacts(l.form_data)" :key="f.label" class="text-xs text-slate-500"><span class="text-slate-400">{{ f.label }}:</span> {{ f.value }}</li>
                    </ul>
                    <div v-if="l.remark" class="text-xs text-slate-500 mt-1">หมายเหตุ: {{ l.remark }}</div>
                  </td>
                  <td class=" text-right whitespace-nowrap text-slate-700">{{ Number(l.unit_price) > 0 ? formatBaht(l.unit_price) : '-' }}</td>
                  <td class="">
                    <span v-if="l.it_line_status" class="px-2 py-0.5 rounded-full text-xs font-semibold" :class="l.it_line_status === 'อนุมัติ' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">{{ l.it_line_status }}</span>
                    <span v-else class="text-xs text-slate-400">ยังไม่ระบุ</span>
                    <div v-if="l.it_line_remark" class="text-xs text-slate-500 mt-1">{{ l.it_line_remark }}</div>
                  </td>
                  <td class=" text-xs">
                    <NuxtLink v-if="l.appsheet_asset_id" :to="`/admin/it/assets/${l.appsheet_asset_id}`" class="text-purple-600 hover:underline font-mono">
                      {{ linkedAssets[l.appsheet_asset_id]?.MachineNumber || linkedAssets[l.appsheet_asset_id]?.AssetTag || `#${l.appsheet_asset_id}` }}
                    </NuxtLink>
                    <span v-else class="text-slate-400">-</span>
                  </td>
                  <td class=" text-xs text-slate-600">{{ l.assign_status || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- MEMO -->
        <div v-if="memo" class="ui-card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="ui-card-title">MEMO</h3>
            <span v-if="memo.confirmed_at" class="px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">ยืนยันแล้ว {{ formatThaiDate(memo.confirmed_at) }}</span>
          </div>
          <dl class="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 mb-4">
            <div><dt class="ui-label">เลขที่</dt><dd class="ui-value">{{ memo.memo_no || '-' }}</dd></div>
            <div><dt class="ui-label">วันที่</dt><dd class="ui-value">{{ formatThaiDate(memo.memo_date) }}</dd></div>
            <div><dt class="ui-label">เรียน</dt><dd class="ui-value">{{ memo.to_name || '-' }}</dd></div>
            <div><dt class="ui-label">ผ่าน</dt><dd class="ui-value">{{ memo.through_name || '-' }}</dd></div>
            <div><dt class="ui-label">จาก</dt><dd class="ui-value">{{ memo.from_name || '-' }}</dd></div>
            <div><dt class="ui-label">งบประมาณ</dt><dd class="ui-value">{{ memo.budget || '-' }}</dd></div>
          </dl>
          <p v-if="memo.topic" class="text-sm"><span class="text-slate-500">เรื่อง:</span> <span class="text-slate-800 font-medium">{{ memo.topic }}</span></p>
          <p v-if="memo.message" class="text-sm text-slate-700 whitespace-pre-line mt-2 p-3 bg-slate-50 rounded-lg">{{ memo.message }}</p>
        </div>
      </div>

      <div class="space-y-6">
        <!-- IT review -->
        <div class="ui-card p-6">
          <h3 class="ui-card-title mb-3">ผล IT ตรวจสอบ</h3>
          <template v-if="header.it_review_status || header.it_reviewed_at">
            <div class="text-sm font-semibold text-slate-800">{{ header.it_review_status || '-' }}</div>
            <div class="text-xs text-slate-500 mt-1">{{ header.it_reviewer_name || '-' }} · {{ formatThaiDate(header.it_reviewed_at) }}</div>
            <p v-if="header.it_review_remark" class="text-sm text-slate-600 mt-2 whitespace-pre-line">{{ header.it_review_remark }}</p>
          </template>
          <p v-else class="text-sm text-slate-400">ยังไม่ตรวจสอบ</p>
          <div v-if="header.assigned_at || header.closed_at" class="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <div v-if="header.assigned_at">จัดสรรโดย {{ header.assigned_by_name || '-' }} · {{ formatThaiDate(header.assigned_at) }}</div>
            <div v-if="header.closed_at">ปิดงานโดย {{ header.closed_by_name || '-' }} · {{ formatThaiDate(header.closed_at) }}</div>
          </div>
        </div>

        <!-- Signatures -->
        <div class="ui-card p-6">
          <h3 class="ui-card-title mb-3">ลายเซ็น</h3>
          <div class="grid grid-cols-2 gap-3">
            <div v-for="s in signatures" :key="s.role" class="border border-slate-100 rounded-xl p-3 text-center">
              <div class="text-[11px] font-semibold text-slate-400 uppercase">{{ s.role }}</div>
              <img v-if="isImage(s.img)" :src="s.img" alt="" class="h-12 mx-auto my-1 object-contain" />
              <div v-else class="h-12 flex items-center justify-center text-xs text-slate-300">ยังไม่เซ็น</div>
              <div class="text-xs text-slate-700 truncate">{{ s.name || '-' }}</div>
              <div class="text-[11px] text-slate-400">{{ s.at ? formatThaiDate(s.at) : '' }}</div>
            </div>
          </div>
        </div>

        <!-- Attachments -->
        <div class="ui-card p-6">
          <h3 class="ui-card-title mb-3">ไฟล์แนบ ({{ attachments.length }})</h3>
          <ul v-if="attachments.length" class="divide-y divide-slate-100 text-sm">
            <li v-for="a in attachments" :key="a.id" class="py-2">
              <a v-if="attachmentUrl(a)" :href="attachmentUrl(a)" target="_blank" rel="noopener" class="text-purple-600 hover:underline break-all">{{ a.original_name || a.google_file_name }} ↗</a>
              <span v-else class="text-slate-700 break-all">{{ a.original_name }}</span>
              <div class="text-[11px] text-slate-400">
                <span v-if="a.category">{{ categoryLabel[a.category] || a.category }} · </span>
                {{ a.uploader_name || '-' }} · {{ formatThaiDate(a.created_at) }}
                <span v-if="a.confirmed_at" class="text-green-600"> · ยืนยันแล้ว</span>
              </div>
            </li>
          </ul>
          <p v-else class="text-sm text-slate-400">ไม่มีไฟล์แนบ</p>
        </div>
      </div>
    </div>
  </RequirePermission>
</template>
