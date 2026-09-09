<script setup lang="ts">
import { useOnboardingStore } from '~/stores/onboarding'
import SectionCard from '~/components/onboarding/ui/SectionCard.vue'
import FormField from '~/components/onboarding/ui/FormField.vue'
import TextInput from '~/components/onboarding/ui/TextInput.vue'
import RepeaterCard from '~/components/onboarding/ui/RepeaterCard.vue'
import AppButton from '~/components/onboarding/ui/AppButton.vue'
import StepDocuments from '~/components/onboarding/StepDocuments.vue'

withDefaults(defineProps<{ showDocuments?: boolean }>(), { showDocuments: true })

const store = useOnboardingStore()

function addReference() {
  store.skillsAndOther.referencePersons.push({ name: '', address: '', position: '', phone: '', relation: '' })
}
function removeReference(index: number) {
  store.skillsAndOther.referencePersons.splice(index, 1)
}
</script>

<template>
  <div class="space-y-5">
    <SectionCard number="9" title="ผู้ให้การรับรอง" subtitle="Personal Reference">
      <p class="text-sm text-slate-500 -mt-2">โปรดให้รายละเอียดของผู้ให้การรับรอง (ซึ่งไม่ใช่ญาติ) ที่รู้จักตัวท่านดี / Give information of references (other than relatives) who know you</p>

      <RepeaterCard v-for="(refPerson, index) in store.skillsAndOther.referencePersons" :key="index" :title="`บุคคลอ้างอิงที่ ${index + 1}`" @remove="removeReference(index)">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <FormField label="ชื่อ-นามสกุล (Name-Surname)">
            <TextInput v-model="refPerson.name" />
          </FormField>
          <FormField label="ที่อยู่/สถานที่ทำงาน (Address/Office)" class="md:col-span-2">
            <TextInput v-model="refPerson.address" />
          </FormField>
          <FormField label="ตำแหน่ง (Position)">
            <TextInput v-model="refPerson.position" />
          </FormField>
          <FormField label="โทรศัพท์ (Telephone)">
            <TextInput v-model="refPerson.phone" digits-only :maxlength="10" />
          </FormField>
          <FormField label="ความสัมพันธ์ (Relations)">
            <TextInput v-model="refPerson.relation" />
          </FormField>
        </div>
      </RepeaterCard>

      <AppButton variant="secondary" size="sm" @click="addReference">
        <template #icon-left>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
        </template>
        เพิ่มบุคคลอ้างอิง
      </AppButton>
    </SectionCard>

    <StepDocuments v-if="showDocuments" />
  </div>
</template>
