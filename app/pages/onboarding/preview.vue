<script setup lang="ts">
import { useOnboardingStore } from '~/stores/onboarding'
import { useRouter } from 'vue-router'
import DocumentPreview from '~/components/document/DocumentPreview.vue'
import AppButton from '~/components/onboarding/ui/AppButton.vue'

const store = useOnboardingStore()
const router = useRouter()

const isSubmitting = ref(false)

const showSuccessModal = ref(false)

const submit = async () => {
  isSubmitting.value = true
  try {
    await store.submitForm()
    showSuccessModal.value = true
  } catch (error) {
    alert('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง')
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}

const closeModal = () => {
  showSuccessModal.value = false
  router.push('/')
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="no-print bg-primary-50 border border-primary-200 text-primary-900 p-4 sm:p-5 rounded-2xl mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 class="font-bold text-lg">ตรวจสอบข้อมูลครั้งสุดท้าย</h3>
        <p class="text-sm text-primary-800/80 mt-0.5">กรุณาตรวจสอบเอกสารของคุณให้ครบถ้วนก่อนกดยืนยัน นี่คือรูปแบบเอกสารที่จะถูกพิมพ์ออกมาจริง</p>
      </div>
      <div class="flex gap-3 flex-shrink-0">
        <AppButton variant="outline" @click="router.push('/onboarding/form')">แก้ไขข้อมูล</AppButton>
        <AppButton :disabled="isSubmitting" @click="submit">
          <template v-if="isSubmitting" #icon-left>
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          </template>
          {{ isSubmitting ? 'กำลังส่ง...' : 'ยืนยันและส่งให้ HR' }}
        </AppButton>
      </div>
    </div>

    <!-- The actual preview component -->
    <DocumentPreview />

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm print:hidden">
      <div class="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl transform transition-all text-center">
        <div class="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-emerald-100">
          <svg class="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h3 class="text-2xl font-bold text-slate-800 mb-2">ส่งข้อมูลสำเร็จ!</h3>
        <p class="text-slate-500 mb-8 text-sm leading-relaxed">ข้อมูลของคุณถูกส่งเข้าระบบเรียบร้อยแล้ว<br>ฝ่าย HR จะทำการตรวจสอบในลำดับถัดไป</p>
        <AppButton variant="success" size="lg" block @click="closeModal">กลับสู่หน้าหลัก</AppButton>
      </div>
    </div>
  </div>
</template>
