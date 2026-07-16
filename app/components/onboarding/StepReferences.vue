<script setup lang="ts">
import { useOnboardingStore } from '~/stores/onboarding'
import SectionCard from '~/components/onboarding/ui/SectionCard.vue'
import FormField from '~/components/onboarding/ui/FormField.vue'
import TextInput from '~/components/onboarding/ui/TextInput.vue'
import RepeaterCard from '~/components/onboarding/ui/RepeaterCard.vue'
import AppButton from '~/components/onboarding/ui/AppButton.vue'
import FileUploadCard from '~/components/onboarding/ui/FileUploadCard.vue'

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

    <SectionCard number="10" title="เอกสารที่ต้องใช้ในการสมัคร" subtitle="Documents">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FileUploadCard
          label="1. รูปถ่ายหน้าตรง (Photo)"
          accept="image/*"
          :model-value="store.documents.photo"
          @update:model-value="v => store.documents.photo = v"
        />
        <FileUploadCard
          label="2. สำเนาบัตรประชาชน (ID Card)"
          :model-value="store.documents.idCard"
          @update:model-value="v => store.documents.idCard = v"
        />
        <FileUploadCard
          label="3. สำเนาทะเบียนบ้าน (House Registration)"
          :model-value="store.documents.houseRegistration"
          @update:model-value="v => store.documents.houseRegistration = v"
        />
        <FileUploadCard
          label="4. วุฒิการศึกษา / ใบรับรอง (Transcript/Degree)"
          :model-value="store.documents.transcript"
          @update:model-value="v => store.documents.transcript = v"
        />
        <FileUploadCard
          v-if="store.personalInfo.prefix === 'นาย'"
          label="5. เอกสารเกณฑ์ทหาร (Military Document)"
          :model-value="store.documents.militaryDocument"
          @update:model-value="v => store.documents.militaryDocument = v"
        />
      </div>
    </SectionCard>
  </div>
</template>
