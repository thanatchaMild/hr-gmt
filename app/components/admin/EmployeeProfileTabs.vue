<script setup lang="ts">
import StatusBadge from '~/components/admin/StatusBadge.vue'

const props = defineProps<{
  formData: any
  documents?: Array<{ id: string; documentType: string; fileUrl: string; uploadedAt: string }>
  itRequests?: Array<{ id: string; type: string; status: string; requestedItems: string[]; notes: string | null; createdAt: string }>
}>()

const activeTab = ref('personal')

const tabs = [
  { id: 'personal', num: 1, name: 'ประวัติส่วนตัว' },
  { id: 'family', num: 2, name: 'ครอบครัว' },
  { id: 'education', num: 3, name: 'การศึกษา' },
  { id: 'experience', num: 4, name: 'การทำงาน' },
  { id: 'skills', num: 5, name: 'ความสามารถทั่วไป' },
  { id: 'references', num: 6, name: 'เอกสารอ้างอิง' },
  { id: 'documents', num: 7, name: 'เอกสารแนบ' },
  { id: 'itHistory', num: 8, name: 'ประวัติขอ IT' }
]

const documentLabels: Record<string, string> = {
  idCard: 'สำเนาบัตรประชาชน',
  houseRegistration: 'สำเนาทะเบียนบ้าน',
  degreeCertificate: 'ใบปริญญา/วุฒิการศึกษา',
  transcript: 'ใบแสดงผลการเรียน (Transcript)',
  bankBook: 'สำเนาสมุดบัญชีธนาคาร',
  photo: 'รูปถ่าย',
  militaryDocument: 'เอกสารทางทหาร',
  other: 'เอกสารอื่นๆ'
}

const itRequestTypeLabels: Record<string, string> = {
  ONBOARDING: 'ขอเมื่อเริ่มงาน',
  OFFBOARDING: 'ระงับสิทธิ์เมื่อลาออก'
}

const itRequestStatusMeta: Record<string, { text: string; color: 'yellow' | 'blue' | 'green' }> = {
  PENDING: { text: 'รอดำเนินการโดยฝ่าย IT', color: 'yellow' },
  IN_PROGRESS: { text: 'กำลังดำเนินการ', color: 'blue' },
  COMPLETED: { text: 'ดำเนินการเสร็จสิ้น', color: 'green' }
}

const personalInfo = computed(() => props.formData?.personalInfo || {})
const contactInfo = computed(() => props.formData?.contactInfo || {})
const familyInfo = computed(() => props.formData?.familyInfo || {})
const educationRecords = computed(() => props.formData?.educationHistory?.records || [])
const workHistory = computed(() => props.formData?.workHistory || [])
const skillsAndOther = computed(() => props.formData?.skillsAndOther || {})
const emergencyContact = computed(() => skillsAndOther.value.emergencyContacts?.[0] || {})
const references = computed(() => skillsAndOther.value.referencePersons?.filter((r: any) => r.name) || [])
</script>

<template>
  <div class="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <!-- Tab Navigation (Stepper style) -->
    <div class="bg-gradient-to-r from-blue-50 via-white to-blue-50 border-b border-blue-100 py-6 px-3 sm:px-6 flex items-start flex-nowrap overflow-x-auto styled-scrollbar">
      <template v-for="(tab, index) in tabs" :key="tab.id">
        <div class="flex flex-col items-center cursor-pointer flex-shrink-0 w-14 sm:w-20" @click="activeTab = tab.id">
          <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3 transition-colors duration-200"
            :class="activeTab === tab.id ? 'bg-blue-100' : 'bg-slate-50 hover:bg-slate-100'">
            <div class="w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm"
              :class="activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 bg-transparent'">
              {{ tab.num }}
            </div>
          </div>
          <span class="text-[10px] sm:text-xs font-bold text-center leading-tight transition-colors duration-200"
            :class="activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'">
            {{ tab.name }}
          </span>
        </div>
        <div v-if="index < tabs.length - 1" class="flex-1 min-w-[8px] sm:min-w-[16px] h-px bg-blue-200 mt-4 sm:mt-6 flex-shrink"></div>
      </template>
    </div>

    <div class="p-6">
      <!-- Personal -->
      <div v-if="activeTab === 'personal'">
        <h4 class="text-lg font-bold text-slate-800 mb-4 pb-3">ข้อมูลส่วนตัว (Personal Information)</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
          <div>
            <p class="text-sm text-slate-500 mb-1">ชื่อ-นามสกุล</p>
            <p class="font-medium text-slate-900">{{ personalInfo.prefix }}{{ personalInfo.firstName }} {{ personalInfo.lastName }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-500 mb-1">เลขบัตรประชาชน</p>
            <p class="font-medium text-slate-900">{{ personalInfo.idCardNumber || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-500 mb-1">วันเกิด</p>
            <p class="font-medium text-slate-900">{{ personalInfo.birthDate || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-500 mb-1">เบอร์โทรศัพท์</p>
            <p class="font-medium text-slate-900">{{ contactInfo.mobilePhone || '-' }}</p>
          </div>
          <div class="sm:col-span-2">
            <p class="text-sm text-slate-500 mb-1">อีเมลส่วนตัว</p>
            <p class="font-medium text-slate-900">{{ contactInfo.email || '-' }}</p>
          </div>
        </div>
      </div>

      <!-- Family -->
      <div v-if="activeTab === 'family'" class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 class="text-lg font-bold text-slate-800 mb-4 pb-3">ข้อมูลครอบครัว</h4>
          <div class="space-y-5">
            <div>
              <p class="text-sm text-slate-500 mb-1">สถานภาพ</p>
              <p class="font-medium text-slate-900">{{ familyInfo.maritalStatus || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-slate-500 mb-1">ชื่อ-นามสกุลบิดา</p>
              <p class="font-medium text-slate-900">{{ familyInfo.father?.name || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-slate-500 mb-1">ชื่อ-นามสกุลมารดา</p>
              <p class="font-medium text-slate-900">{{ familyInfo.mother?.name || '-' }}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-lg font-bold text-slate-800 mb-4 pb-3">ผู้ติดต่อฉุกเฉิน</h4>
          <div class="space-y-5">
            <div>
              <p class="text-sm text-slate-500 mb-1">ชื่อ-นามสกุล</p>
              <p class="font-medium text-slate-900">{{ emergencyContact.name || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-slate-500 mb-1">ความสัมพันธ์</p>
              <p class="font-medium text-slate-900">{{ emergencyContact.relation || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-slate-500 mb-1">เบอร์โทรศัพท์</p>
              <p class="font-medium text-slate-900">{{ emergencyContact.phone || '-' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Education -->
      <div v-if="activeTab === 'education'">
        <h4 class="text-lg font-bold text-slate-800 mb-4 pb-3">ประวัติการศึกษา</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-slate-500 bg-slate-50 border-y border-slate-200">
              <tr>
                <th class="px-4 py-3 font-medium">ระดับการศึกษา</th>
                <th class="px-4 py-3 font-medium">สถาบัน</th>
                <th class="px-4 py-3 font-medium">สาขา/วิชาเอก</th>
                <th class="px-4 py-3 font-medium">ปีที่สำเร็จ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(edu, idx) in educationRecords" :key="idx" class="hover:bg-slate-50">
                <td class="px-4 py-4 text-slate-900">{{ edu.level }}</td>
                <td class="px-4 py-4 text-slate-900">{{ edu.institution }}</td>
                <td class="px-4 py-4 text-slate-900">{{ edu.major }}</td>
                <td class="px-4 py-4 text-slate-900">{{ edu.graduatedYear }}</td>
              </tr>
              <tr v-if="educationRecords.length === 0">
                <td colspan="4" class="px-4 py-6 text-center text-slate-400">ไม่มีข้อมูล</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Experience -->
      <div v-if="activeTab === 'experience'">
        <h4 class="text-lg font-bold text-slate-800 mb-4 pb-3">ประวัติการทำงาน</h4>
        <div class="space-y-4">
          <div v-for="(exp, idx) in workHistory" :key="idx" class="border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors bg-slate-50/50">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">บริษัท</p>
                <p class="font-medium text-slate-900">{{ exp.company }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">ตำแหน่ง</p>
                <p class="font-medium text-slate-900">{{ exp.lastPosition || exp.firstPosition }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">ระยะเวลา</p>
                <p class="font-medium text-slate-900">{{ exp.startDate }} - {{ exp.endDate }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500 uppercase tracking-wider mb-1">เหตุผลที่ออก</p>
                <p class="font-medium text-slate-900">{{ exp.reasonForLeaving }}</p>
              </div>
            </div>
          </div>
          <p v-if="workHistory.length === 0" class="text-center text-slate-400 py-6">ไม่มีข้อมูล</p>
        </div>
      </div>

      <!-- Skills -->
      <div v-if="activeTab === 'skills'">
        <h4 class="text-lg font-bold text-slate-800 mb-4 pb-3">ความสามารถทั่วไป</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors bg-slate-50/50">
            <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">ความสามารถทางภาษา</p>
            <p class="font-medium text-slate-900">
              <span v-for="(lang, idx) in skillsAndOther.languages" :key="idx">{{ lang.language }} ({{ lang.speaking || '-' }})<br></span>
            </p>
          </div>
          <div class="border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors bg-slate-50/50">
            <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">ความสามารถทางคอมพิวเตอร์</p>
            <p class="font-medium text-slate-900">{{ skillsAndOther.computerAbility || '-' }}</p>
          </div>
          <div class="border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors bg-slate-50/50">
            <p class="text-xs text-slate-500 uppercase tracking-wider mb-2">ความสามารถอื่นๆ</p>
            <p class="font-medium text-slate-900">{{ skillsAndOther.otherQualifications || '-' }}</p>
          </div>
        </div>
      </div>

      <!-- References -->
      <div v-if="activeTab === 'references'">
        <h4 class="text-lg font-bold text-slate-800 mb-4 pb-3">บุคคลอ้างอิง</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="(ref, idx) in references" :key="idx" class="border border-slate-200 rounded-xl p-5 flex gap-4 items-start hover:border-blue-300 transition-colors">
            <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">
              {{ idx + 1 }}
            </div>
            <div>
              <p class="font-bold text-slate-900">{{ ref.name }}</p>
              <p class="text-sm text-slate-600 mt-0.5">{{ ref.position }} - {{ ref.relation }}</p>
              <p class="text-sm font-medium text-slate-700 mt-2">{{ ref.phone }}</p>
            </div>
          </div>
          <p v-if="references.length === 0" class="text-center text-slate-400 py-6 col-span-2">ไม่มีข้อมูล</p>
        </div>
      </div>

      <!-- Documents -->
      <div v-if="activeTab === 'documents'">
        <h4 class="text-lg font-bold text-slate-800 mb-4 pb-3">เอกสารแนบตอนสมัครงาน</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a v-for="doc in documents" :key="doc.id" :href="doc.fileUrl" target="_blank"
            class="flex items-center gap-3 border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <div class="min-w-0">
              <p class="font-medium text-slate-900 truncate">{{ documentLabels[doc.documentType] || doc.documentType }}</p>
              <p class="text-xs text-slate-500 mt-0.5">อัปโหลดเมื่อ {{ doc.uploadedAt?.slice(0, 10) }}</p>
            </div>
          </a>
        </div>
        <p v-if="!documents || documents.length === 0" class="text-center text-slate-400 py-6">ไม่มีเอกสารแนบ</p>
      </div>

      <!-- IT Request History -->
      <div v-if="activeTab === 'itHistory'">
        <h4 class="text-lg font-bold text-slate-800 mb-4 pb-3">ประวัติการขออุปกรณ์ IT</h4>
        <div class="space-y-3">
          <div v-for="req in itRequests" :key="req.id" class="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors bg-slate-50/50">
            <div class="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <span class="font-medium text-slate-900">{{ itRequestTypeLabels[req.type] || req.type }}</span>
              <StatusBadge :text="itRequestStatusMeta[req.status]?.text || req.status" :color="itRequestStatusMeta[req.status]?.color || 'yellow'" />
            </div>
            <p class="text-sm text-slate-600">สิ่งที่ขอ: {{ req.requestedItems?.join(', ') || '-' }}</p>
            <p v-if="req.notes" class="text-sm text-slate-500 mt-1">หมายเหตุ: {{ req.notes }}</p>
            <p class="text-xs text-slate-400 mt-2">วันที่ส่งคำขอ: {{ req.createdAt?.slice(0, 10) }}</p>
          </div>
        </div>
        <p v-if="!itRequests || itRequests.length === 0" class="text-center text-slate-400 py-6">ไม่มีประวัติการขออุปกรณ์ IT</p>
      </div>
    </div>
  </div>
</template>
