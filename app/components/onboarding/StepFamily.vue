<script setup lang="ts">
import { useOnboardingStore } from '~/stores/onboarding'
import SectionCard from '~/components/onboarding/ui/SectionCard.vue'
import FormField from '~/components/onboarding/ui/FormField.vue'
import TextInput from '~/components/onboarding/ui/TextInput.vue'
import RadioPills from '~/components/onboarding/ui/RadioPills.vue'
import RepeaterCard from '~/components/onboarding/ui/RepeaterCard.vue'
import AppButton from '~/components/onboarding/ui/AppButton.vue'

const store = useOnboardingStore()

const maritalStatusOptions = [
  { value: 'SINGLE', label: 'โสด', subLabel: '(Single)' },
  { value: 'MARRIED', label: 'สมรส', subLabel: '(Married)' },
  { value: 'SEPARATED', label: 'แยกกันอยู่', subLabel: '(Separated)' },
  { value: 'DIVORCED', label: 'หย่า', subLabel: '(Divorced)' },
  { value: 'WIDOWED', label: 'หม้าย', subLabel: '(Widowed)' }
]

const relatives = { father: 'บิดา (Father)', mother: 'มารดา (Mother)', spouse: 'คู่สมรส (Spouse)' } as const

function addSibling() {
  store.familyInfo.siblings.push({ name: '', age: null, occupation: '', address: '', phone: '' })
}
function removeSibling(index: number) {
  store.familyInfo.siblings.splice(index, 1)
}
function addChild() {
  store.familyInfo.children.push({ name: '', age: null, occupation: '', address: '', phone: '' })
}
function removeChild(index: number) {
  store.familyInfo.children.splice(index, 1)
}
</script>

<template>
  <div class="space-y-5">
    <SectionCard number="2" title="รายละเอียดครอบครัว" subtitle="Family Details">
      <FormField label="สถานภาพสมรส (Marital Status)">
        <RadioPills v-model="store.familyInfo.maritalStatus" name="maritalStatus" :options="maritalStatusOptions" />
      </FormField>

      <div v-for="(label, key) in relatives" :key="key" class="pt-2">
        <p class="text-sm font-semibold text-slate-600 mb-3">{{ label }}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <FormField label="ชื่อ-นามสกุล" class="md:col-span-2">
            <TextInput v-model="store.familyInfo[key].name" />
          </FormField>
          <FormField label="อายุ">
            <TextInput v-model="store.familyInfo[key].age" type="number" />
          </FormField>
          <FormField label="โทรศัพท์">
            <TextInput v-model="store.familyInfo[key].phone" digits-only :maxlength="10" />
          </FormField>
          <FormField label="อาชีพ/ตำแหน่ง">
            <TextInput v-model="store.familyInfo[key].occupation" />
          </FormField>
          <FormField label="ที่อยู่/ที่ทำงาน" class="sm:col-span-2 md:col-span-3">
            <TextInput v-model="store.familyInfo[key].address" />
          </FormField>
        </div>
      </div>
    </SectionCard>

    <SectionCard number="2.1" title="พี่น้อง" subtitle="Siblings">
      <div class="grid grid-cols-2 gap-4 mb-1">
        <FormField label="จำนวนพี่น้องทั้งหมด (คน)">
          <TextInput v-model="store.familyInfo.siblingsTotal" type="number" />
        </FormField>
        <FormField label="ท่านเป็นคนที่">
          <TextInput v-model="store.familyInfo.birthOrder" type="number" />
        </FormField>
      </div>

      <RepeaterCard v-for="(sibling, index) in store.familyInfo.siblings" :key="index" :title="`พี่น้องคนที่ ${index + 1}`" @remove="removeSibling(index)">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <FormField label="ชื่อ-นามสกุล" class="md:col-span-2">
            <TextInput v-model="sibling.name" />
          </FormField>
          <FormField label="อายุ">
            <TextInput v-model="sibling.age" type="number" />
          </FormField>
          <FormField label="โทรศัพท์">
            <TextInput v-model="sibling.phone" digits-only :maxlength="10" />
          </FormField>
          <FormField label="อาชีพ/ตำแหน่ง" class="md:col-span-2">
            <TextInput v-model="sibling.occupation" />
          </FormField>
          <FormField label="ที่อยู่/ที่ทำงาน" class="sm:col-span-2">
            <TextInput v-model="sibling.address" />
          </FormField>
        </div>
      </RepeaterCard>

      <AppButton variant="secondary" size="sm" @click="addSibling">
        <template #icon-left>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
        </template>
        เพิ่มพี่น้อง
      </AppButton>
    </SectionCard>

    <SectionCard number="2.2" title="บุตร" subtitle="Children">
      <FormField label="จำนวนบุตร (คน)" class="max-w-[200px]">
        <TextInput v-model="store.familyInfo.childrenTotal" type="number" />
      </FormField>

      <RepeaterCard v-for="(child, index) in store.familyInfo.children" :key="index" :title="`บุตรคนที่ ${index + 1}`" @remove="removeChild(index)">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <FormField label="ชื่อ-นามสกุล" class="md:col-span-2">
            <TextInput v-model="child.name" />
          </FormField>
          <FormField label="อายุ">
            <TextInput v-model="child.age" type="number" />
          </FormField>
          <FormField label="โทรศัพท์">
            <TextInput v-model="child.phone" digits-only :maxlength="10" />
          </FormField>
          <FormField label="อาชีพ/ตำแหน่ง" class="md:col-span-2">
            <TextInput v-model="child.occupation" />
          </FormField>
          <FormField label="ที่อยู่/ที่ทำงาน" class="sm:col-span-2">
            <TextInput v-model="child.address" />
          </FormField>
        </div>
      </RepeaterCard>

      <AppButton variant="secondary" size="sm" @click="addChild">
        <template #icon-left>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
        </template>
        เพิ่มบุตร
      </AppButton>
    </SectionCard>
  </div>
</template>
