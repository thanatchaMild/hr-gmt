<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
import RequirePermission from '~/components/admin/RequirePermission.vue'
import { useOnboardingStore } from '~/stores/onboarding'
import { useRoute, useRouter } from 'vue-router'

import StepPersonal from '~/components/onboarding/StepPersonal.vue'
import StepFamily from '~/components/onboarding/StepFamily.vue'
import StepEducation from '~/components/onboarding/StepEducation.vue'
import StepWork from '~/components/onboarding/StepWork.vue'
import StepAbilities from '~/components/onboarding/StepAbilities.vue'
import StepReferences from '~/components/onboarding/StepReferences.vue'

const route = useRoute()
const router = useRouter()
const employeeId = route.params.id as string
const store = useOnboardingStore()

const { data: employee } = await useFetch<any>(`/api/employees/${employeeId}`)

const isReady = ref(false)
watch(employee, (val) => {
  if (val) {
    store.loadFromEmployee(val)
    isReady.value = true
  }
}, { immediate: true })

const currentStep = ref(1)
const steps = [
  { id: 1, name: 'ประวัติส่วนตัว', component: StepPersonal },
  { id: 2, name: 'ครอบครัว', component: StepFamily },
  { id: 3, name: 'การศึกษา', component: StepEducation },
  { id: 4, name: 'การทำงาน', component: StepWork },
  { id: 5, name: 'ความสามารถทั่วไป', component: StepAbilities },
  { id: 6, name: 'เอกสารอ้างอิง', component: StepReferences }
]

const isSaving = ref(false)
const saveError = ref('')

async function uploadIfFile(value: File | string | null): Promise<string | null> {
  if (!value) return null
  if (typeof value === 'string') return value
  const formData = new FormData()
  formData.append('file', value)
  const { url } = await $fetch<{ url: string }>('/api/uploads', { method: 'POST', body: formData })
  return url
}

const save = async () => {
  isSaving.value = true
  saveError.value = ''
  try {
    const documents = {
      idCard: await uploadIfFile(store.documents.idCard),
      houseRegistration: await uploadIfFile(store.documents.houseRegistration),
      degreeCertificate: await uploadIfFile(store.documents.degreeCertificate),
      transcript: await uploadIfFile(store.documents.transcript),
      bankBook: await uploadIfFile(store.documents.bankBook),
      photo: await uploadIfFile(store.documents.photo),
      militaryDocument: await uploadIfFile(store.documents.militaryDocument)
    }

    await $fetch(`/api/employees/${employeeId}/form-data`, {
      method: 'PATCH',
      body: {
        personalInfo: store.personalInfo,
        contactInfo: store.contactInfo,
        familyInfo: store.familyInfo,
        educationHistory: store.educationHistory,
        trainingHistory: store.trainingHistory,
        workHistory: store.workHistory,
        skillsAndOther: store.skillsAndOther,
        sensitiveInfo: store.sensitiveInfo,
        documents
      }
    })
    alert('บันทึกการแก้ไขเรียบร้อยแล้ว')
    router.back()
  } catch {
    saveError.value = 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <RequirePermission requiredRole="HR_ADMIN">
    <div v-if="!isReady" class="flex justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    </div>
    <div v-else class="max-w-4xl mx-auto pb-12">
      <div class="flex items-center gap-4 mb-6">
        <button @click="router.back()" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <div>
          <h2 class="text-xl font-bold text-slate-800">แก้ไขข้อมูล — {{ employee.firstName }} {{ employee.lastName }}</h2>
          <p class="text-sm text-slate-500 mt-0.5">แก้ไขข้อมูลใบสมัครที่เคยกรอกไว้ (ใช้โดยฝ่าย HR เท่านั้น)</p>
        </div>
      </div>

      <!-- Section Tabs -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
        <div class="flex items-center flex-wrap gap-2">
          <button
            v-for="step in steps"
            :key="step.id"
            type="button"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="currentStep === step.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'"
            @click="currentStep = step.id"
          >
            {{ step.id }}. {{ step.name }}
          </button>
        </div>
      </div>

      <!-- Step Content -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
        <component :is="steps[currentStep - 1].component" />

        <div v-if="saveError" class="mt-4 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">{{ saveError }}</div>

        <div class="flex justify-end items-center mt-8 pt-6 border-t border-slate-200 gap-3">
          <button @click="router.back()" class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700">ยกเลิก</button>
          <button @click="save" :disabled="isSaving" class="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {{ isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข' }}
          </button>
        </div>
      </div>
    </div>
  </RequirePermission>
</template>
