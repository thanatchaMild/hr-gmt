<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from '~/stores/onboarding'
import AppButton from '~/components/onboarding/ui/AppButton.vue'

import StepPersonal from '~/components/onboarding/StepPersonal.vue'
import StepFamily from '~/components/onboarding/StepFamily.vue'
import StepEducation from '~/components/onboarding/StepEducation.vue'
import StepWork from '~/components/onboarding/StepWork.vue'
import StepAbilities from '~/components/onboarding/StepAbilities.vue'
import StepReferences from '~/components/onboarding/StepReferences.vue'

const store = useOnboardingStore()
const router = useRouter()

// If PDPA is not accepted, redirect to PDPA
onMounted(() => {
  if (!store.pdpaConsent) {
    router.push('/onboarding/pdpa')
  }
})

const currentStep = ref(1)
const totalSteps = 6

const steps = [
  { id: 1, name: 'ประวัติส่วนตัว', component: StepPersonal },
  { id: 2, name: 'ครอบครัว', component: StepFamily },
  { id: 3, name: 'การศึกษา', component: StepEducation },
  { id: 4, name: 'การทำงาน', component: StepWork },
  { id: 5, name: 'ความสามารถทั่วไป', component: StepAbilities },
  { id: 6, name: 'เอกสารอ้างอิง', component: StepReferences },
]

const progressPercent = computed(() => Math.round((currentStep.value / totalSteps) * 100))

function nextStep() {
  if (currentStep.value < totalSteps) {
    currentStep.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const goToPreview = () => {
  router.push('/onboarding/preview')
}
</script>

<template>
  <div class="max-w-4xl mx-auto pb-12">
    <!-- Stepper Header -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
      <!-- Always-visible progress summary -->
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-semibold text-slate-700">
          ขั้นตอนที่ {{ currentStep }} จาก {{ totalSteps }}: <span class="text-primary-700">{{ steps[currentStep - 1].name }}</span>
        </p>
        <p class="text-xs font-medium text-slate-400">{{ progressPercent }}%</p>
      </div>
      <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-5">
        <div class="h-full bg-primary-600 rounded-full transition-all duration-300" :style="{ width: progressPercent + '%' }"></div>
      </div>

      <!-- Full step circles (compact, no horizontal scroll needed) -->
      <div class="hidden sm:flex items-center justify-between">
        <template v-for="(step, index) in steps" :key="step.id">
          <button
            type="button"
            class="flex flex-col items-center relative z-10 cursor-pointer group flex-shrink-0"
            @click="currentStep = step.id"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300"
              :class="currentStep === step.id ? 'bg-primary-600 text-white ring-4 ring-primary-100' : (step.id < currentStep ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200')"
            >
              <svg v-if="step.id < currentStep" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <span v-else>{{ step.id }}</span>
            </div>
          </button>
          <div v-if="index < steps.length - 1" class="flex-1 h-0.5 mx-1.5 rounded-full" :class="step.id < currentStep ? 'bg-emerald-500' : 'bg-slate-100'"></div>
        </template>
      </div>
    </div>

    <!-- Employee Type Selection -->
    <div v-if="currentStep === 1" class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
      <label class="block text-sm font-semibold text-slate-700 mb-3">ประเภทพนักงานที่สมัคร <span class="text-red-500">*</span></label>
      <div class="flex flex-col sm:flex-row gap-3">
        <label
          class="flex-1 border rounded-xl p-4 cursor-pointer transition-colors flex items-center gap-3"
          :class="store.employeeType === 'DAILY' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-slate-200 hover:bg-slate-50'"
        >
          <input type="radio" v-model="store.employeeType" value="DAILY" class="w-5 h-5 text-primary-600 focus:ring-2 focus:ring-primary-500/30">
          <div class="flex flex-col">
            <span class="font-bold text-slate-900">พนักงานรายวัน</span>
            <span class="text-sm text-slate-500">Daily Employee</span>
          </div>
        </label>
        <label
          class="flex-1 border rounded-xl p-4 cursor-pointer transition-colors flex items-center gap-3"
          :class="store.employeeType === 'MONTHLY' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-slate-200 hover:bg-slate-50'"
        >
          <input type="radio" v-model="store.employeeType" value="MONTHLY" class="w-5 h-5 text-primary-600 focus:ring-2 focus:ring-primary-500/30">
          <div class="flex flex-col">
            <span class="font-bold text-slate-900">พนักงานรายเดือน</span>
            <span class="text-sm text-slate-500">Monthly Employee</span>
          </div>
        </label>
      </div>
    </div>

    <!-- Step Content Container -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
      <Transition mode="out-in" name="fade">
        <component :is="steps[currentStep - 1].component" />
      </Transition>

      <!-- Navigation Buttons -->
      <div class="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
        <AppButton v-if="currentStep > 1" variant="outline" size="lg" @click="prevStep">
          <template #icon-left>
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          </template>
          ย้อนกลับ
        </AppButton>
        <div v-else></div>

        <AppButton v-if="currentStep < totalSteps" size="lg" @click="nextStep">
          ถัดไป
          <template #icon-right>
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          </template>
        </AppButton>

        <AppButton v-if="currentStep === totalSteps" variant="success" size="lg" @click="goToPreview">
          ตรวจสอบข้อมูล & ยืนยันการส่ง
          <template #icon-right>
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          </template>
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
