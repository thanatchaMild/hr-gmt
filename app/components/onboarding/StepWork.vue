<script setup lang="ts">
import { useOnboardingStore } from '~/stores/onboarding'
import SectionCard from '~/components/onboarding/ui/SectionCard.vue'
import FormField from '~/components/onboarding/ui/FormField.vue'
import TextInput from '~/components/onboarding/ui/TextInput.vue'
import TextareaInput from '~/components/onboarding/ui/TextareaInput.vue'
import RepeaterCard from '~/components/onboarding/ui/RepeaterCard.vue'
import AppButton from '~/components/onboarding/ui/AppButton.vue'

const store = useOnboardingStore()

function addWork() {
  store.workHistory.push({
    company: '', businessType: '', address: '', phone: '', responsibility: '',
    startDate: '', endDate: '', firstPosition: '', lastPosition: '',
    startingSalary: '', lastSalary: '', otherIncome: '', reasonForLeaving: ''
  })
}

function removeWork(index: number) {
  store.workHistory.splice(index, 1)
}
</script>

<template>
  <div class="space-y-5">
    <SectionCard number="5" title="ประวัติการทำงาน" subtitle="เรียงจากปัจจุบันไปหาอดีต / List last employment first">
      <RepeaterCard v-for="(work, index) in store.workHistory" :key="index" :title="`สถานที่ทำงานที่ ${index + 1}`" @remove="removeWork(index)">
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="ชื่อบริษัท (Company's Name)">
              <TextInput v-model="work.company" />
            </FormField>
            <FormField label="ประเภทธุรกิจ (Type of Business)">
              <TextInput v-model="work.businessType" />
            </FormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="ที่อยู่ (Address)" class="sm:col-span-2">
              <TextareaInput v-model="work.address" :rows="2" />
            </FormField>
            <FormField label="โทรศัพท์ (Telephone)">
              <TextInput v-model="work.phone" digits-only :maxlength="10" />
            </FormField>
          </div>

          <FormField label="ลักษณะงานที่รับผิดชอบโดยย่อ (Brief Responsibility)">
            <TextareaInput v-model="work.responsibility" :rows="2" />
          </FormField>

          <div class="pt-3 border-t border-slate-200">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">ระยะเวลาและตำแหน่ง</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <FormField label="วันเริ่มงาน">
                <TextInput v-model="work.startDate" type="date" />
              </FormField>
              <FormField label="ถึง (To)">
                <TextInput v-model="work.endDate" type="date" />
              </FormField>
              <FormField label="ตำแหน่งแรกเข้า">
                <TextInput v-model="work.firstPosition" />
              </FormField>
              <FormField label="ตำแหน่งสุดท้าย">
                <TextInput v-model="work.lastPosition" />
              </FormField>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-200">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">ค่าตอบแทน</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="เงินเดือนแรกเข้า">
                <TextInput v-model="work.startingSalary" placeholder="บาท/เดือน" />
              </FormField>
              <FormField label="เงินเดือนสุดท้าย">
                <TextInput v-model="work.lastSalary" placeholder="บาท/เดือน" />
              </FormField>
              <FormField label="รายได้อื่นๆ">
                <TextInput v-model="work.otherIncome" placeholder="บาท/เดือน" />
              </FormField>
            </div>
          </div>

          <FormField label="เหตุผลที่ออกจากงาน (Reason For Leaving)">
            <TextInput v-model="work.reasonForLeaving" />
          </FormField>
        </div>
      </RepeaterCard>

      <AppButton variant="secondary" size="sm" @click="addWork">
        <template #icon-left>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
        </template>
        เพิ่มประวัติการทำงาน
      </AppButton>
    </SectionCard>
  </div>
</template>
