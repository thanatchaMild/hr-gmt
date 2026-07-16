<script setup lang="ts">
definePageMeta({
  layout: false
})
import { useOnboardingStore } from '~/stores/onboarding'
import { useRoute, useRouter } from 'vue-router'
import DocumentPreview from '~/components/document/DocumentPreview.vue'

const route = useRoute()
const router = useRouter()
const applicationId = route.params.id as string

const { data } = await useFetch<any>(`/api/employees/${applicationId}`)

const store = useOnboardingStore()

if (data.value) {
  const formData = data.value.formData || {}
  store.employeeType = data.value.employeeType
  store.pdpaConsentDate = data.value.pdpaConsentDate
  if (formData.personalInfo) Object.assign(store.personalInfo, formData.personalInfo)
  if (formData.contactInfo) Object.assign(store.contactInfo, formData.contactInfo)
  if (formData.familyInfo) Object.assign(store.familyInfo, formData.familyInfo)
  if (formData.educationHistory) Object.assign(store.educationHistory, formData.educationHistory)
  if (formData.trainingHistory) store.trainingHistory = formData.trainingHistory
  if (formData.workHistory) store.workHistory = formData.workHistory
  if (formData.skillsAndOther) Object.assign(store.skillsAndOther, formData.skillsAndOther)
  if (formData.sensitiveInfo) Object.assign(store.sensitiveInfo, formData.sensitiveInfo)
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div v-if="!data" class="no-print flex justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    </div>
    <template v-else>
      <div class="no-print bg-blue-50 border border-blue-200 text-blue-900 p-4 sm:p-5 rounded-2xl mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 class="font-bold text-lg">ใบสมัครงาน (มุมมองสำหรับ HR)</h3>
          <p class="text-sm text-blue-800/80 mt-0.5">รูปแบบเอกสารเดียวกับที่จะถูกพิมพ์ออกมาจริง</p>
        </div>
        <button @click="router.back()" class="px-4 py-2.5 bg-white border border-blue-200 rounded-lg font-medium text-blue-700 hover:bg-blue-50 shadow-sm flex-shrink-0 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          กลับ
        </button>
      </div>

      <DocumentPreview />
    </template>
  </div>
</template>
