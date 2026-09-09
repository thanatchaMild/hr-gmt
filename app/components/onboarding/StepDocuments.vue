<script setup lang="ts">
import { useOnboardingStore } from '~/stores/onboarding'
import SectionCard from '~/components/onboarding/ui/SectionCard.vue'
import FileUploadCard from '~/components/onboarding/ui/FileUploadCard.vue'

const store = useOnboardingStore()
</script>

<template>
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
</template>
