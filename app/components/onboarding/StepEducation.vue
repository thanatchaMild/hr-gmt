<script setup lang="ts">
import { useOnboardingStore } from '~/stores/onboarding'
import SectionCard from '~/components/onboarding/ui/SectionCard.vue'
import FormField from '~/components/onboarding/ui/FormField.vue'
import TextInput from '~/components/onboarding/ui/TextInput.vue'
import SelectInput from '~/components/onboarding/ui/SelectInput.vue'
import RadioPills from '~/components/onboarding/ui/RadioPills.vue'
import RepeaterCard from '~/components/onboarding/ui/RepeaterCard.vue'
import AppButton from '~/components/onboarding/ui/AppButton.vue'

const store = useOnboardingStore()

function addEducation() {
  store.educationHistory.records.push({ level: '', institution: '', degree: '', major: '', graduatedYear: '', gpa: '' })
}
function removeEducation(index: number) {
  store.educationHistory.records.splice(index, 1)
}
function addTraining() {
  store.trainingHistory.push({ course: '', institution: '', certificate: '', period: '', year: '' })
}
function removeTraining(index: number) {
  store.trainingHistory.splice(index, 1)
}

const continuingOptions = [
  { value: false, label: 'ไม่', subLabel: '(No)' },
  { value: true, label: 'เรียนต่อ', subLabel: '(Yes)' }
]
</script>

<template>
  <div class="space-y-5">
    <SectionCard number="3" title="ประวัติการศึกษา" subtitle="Education Background">
      <RepeaterCard v-for="(edu, index) in store.educationHistory.records" :key="index" :title="`ระดับการศึกษาที่ ${index + 1}`" @remove="removeEducation(index)">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <FormField label="ระดับการศึกษา / วุฒิการศึกษา">
            <SelectInput v-model="edu.level">
              <option value="">เลือก...</option>
              <option value="มัธยมศึกษาตอนต้น">มัธยมศึกษาตอนต้น (secondary)</option>
              <option value="มัธยมศึกษาตอนปลาย/ปวช.">มัธยมศึกษาตอนปลาย/ปวช. (High School/Vocational)</option>
              <option value="อนุปริญญา/ปวส.">อนุปริญญา/ปวส. (Diploma/Higher Vocational)</option>
              <option value="ปริญญาตรี">ปริญญาตรี/Bachelor Degree</option>
              <option value="ปริญญาโท">ปริญญาโท/Master Degree</option>
              <option value="อื่น ๆ">อื่น ๆ/Other</option>
            </SelectInput>
          </FormField>
          <FormField label="สถานศึกษา/จังหวัด">
            <TextInput v-model="edu.institution" />
          </FormField>
          <FormField label="คณะ/วิชาเอก">
            <TextInput v-model="edu.major" />
          </FormField>
          <FormField label="ปีที่จบ">
            <TextInput v-model="edu.graduatedYear" />
          </FormField>
          <FormField label="คะแนนเฉลี่ย (GPA)">
            <TextInput v-model="edu.gpa" />
          </FormField>
        </div>
      </RepeaterCard>

      <AppButton variant="secondary" size="sm" @click="addEducation">
        <template #icon-left>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
        </template>
        เพิ่มประวัติการศึกษา
      </AppButton>

      <div class="mt-2 bg-primary-50/60 p-4 rounded-xl border border-primary-100">
        <FormField label="ท่านจะศึกษาต่อหรือไม่ (Are you continuing your studies?)">
          <RadioPills v-model="store.educationHistory.continuingStudies" name="continuingStudies" :options="continuingOptions" />
        </FormField>
        <FormField v-if="store.educationHistory.continuingStudies" label="อธิบายเพิ่มเติม" class="mt-3">
          <TextInput v-model="store.educationHistory.continuingDetails" />
        </FormField>
      </div>
    </SectionCard>

    <SectionCard number="4" title="ประวัติการฝึกอบรม/ดูงาน" subtitle="Job Training / Inspection">
      <RepeaterCard v-for="(train, index) in store.trainingHistory" :key="index" :title="`หลักสูตรที่ ${index + 1}`" @remove="removeTraining(index)">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <FormField label="ชื่อหลักสูตร (Course)">
            <TextInput v-model="train.course" />
          </FormField>
          <FormField label="สถาบัน (Institute)">
            <TextInput v-model="train.institution" />
          </FormField>
          <FormField label="วุฒิที่ได้รับ">
            <TextInput v-model="train.certificate" />
          </FormField>
          <FormField label="ระยะเวลา (Period)">
            <TextInput v-model="train.period" />
          </FormField>
          <FormField label="ปี (Year)">
            <TextInput v-model="train.year" />
          </FormField>
        </div>
      </RepeaterCard>

      <AppButton variant="secondary" size="sm" @click="addTraining">
        <template #icon-left>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
        </template>
        เพิ่มประวัติการฝึกอบรม
      </AppButton>
    </SectionCard>
  </div>
</template>
