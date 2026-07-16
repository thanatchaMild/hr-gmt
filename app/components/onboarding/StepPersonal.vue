<script setup lang="ts">
import { useOnboardingStore } from '~/stores/onboarding'
import SectionCard from '~/components/onboarding/ui/SectionCard.vue'
import FormField from '~/components/onboarding/ui/FormField.vue'
import TextInput from '~/components/onboarding/ui/TextInput.vue'
import SelectInput from '~/components/onboarding/ui/SelectInput.vue'
import TextareaInput from '~/components/onboarding/ui/TextareaInput.vue'
import RadioPills from '~/components/onboarding/ui/RadioPills.vue'

const store = useOnboardingStore()

const militaryStatusOptions = [
  { value: 'Exempted', label: 'ได้รับการยกเว้น', subLabel: '(Exempted)' },
  { value: 'Passed', label: 'ผ่านการเกณฑ์ทหาร', subLabel: '(Passed)' },
  { value: 'Non Exempted', label: 'ยังไม่ผ่านการเกณฑ์ทหาร', subLabel: '(Non Exempted)' },
  { value: 'Territorial Degree Student', label: 'เรียนรักษาดินแดน' },
  { value: 'Date Entered Service', label: 'รับราชการทหารแล้ว' }
]
</script>

<template>
  <div class="space-y-5">
    <SectionCard number="1" title="ตำแหน่งที่สมัคร" subtitle="Position Applied">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="ตำแหน่งที่ต้องการสมัคร" required>
          <TextInput v-model="store.personalInfo.positionApplied" placeholder="เช่น พนักงานฝ่ายผลิต" />
        </FormField>
        <FormField label="วันที่พร้อมจะเริ่มงานได้" required>
          <TextInput v-model="store.personalInfo.availableStartDate" type="date" />
        </FormField>
      </div>
    </SectionCard>

    <SectionCard number="2" title="ประวัติส่วนตัว" subtitle="Personal Details">
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <FormField label="คำนำหน้าชื่อ">
          <SelectInput v-model="store.personalInfo.prefix">
            <option value="">เลือก...</option>
            <option value="นาย">นาย</option>
            <option value="นาง">นาง</option>
            <option value="นางสาว">นางสาว</option>
          </SelectInput>
        </FormField>
        <FormField label="ชื่อ (ภาษาไทย)" class="sm:col-span-1">
          <TextInput v-model="store.personalInfo.firstName" />
        </FormField>
        <FormField label="นามสกุล (ภาษาไทย)" class="sm:col-span-2">
          <TextInput v-model="store.personalInfo.lastName" />
        </FormField>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <FormField label="คำนำหน้าชื่อ (English)">
          <SelectInput v-model="store.personalInfo.prefixEn">
            <option value="">เลือก...</option>
            <option value="Mr.">Mr.</option>
            <option value="Mrs.">Mrs.</option>
            <option value="Miss">Miss</option>
          </SelectInput>
        </FormField>
        <FormField label="ชื่อ (English)" class="sm:col-span-1">
          <TextInput v-model="store.personalInfo.firstNameEn" />
        </FormField>
        <FormField label="นามสกุล (English)" class="sm:col-span-2">
          <TextInput v-model="store.personalInfo.lastNameEn" />
        </FormField>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="ที่อยู่ปัจจุบัน (Present Address)">
          <TextareaInput v-model="store.contactInfo.presentAddress" :rows="2" />
        </FormField>
        <FormField label="ที่อยู่ตามทะเบียนบ้าน (Permanent Address)">
          <TextareaInput v-model="store.contactInfo.permanentAddress" :rows="2" />
        </FormField>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="โทรศัพท์บ้าน" hint="ตัวเลขเท่านั้น">
          <TextInput v-model="store.contactInfo.homePhone" type="tel" digits-only :maxlength="10" />
        </FormField>
        <FormField label="โทรศัพท์มือถือ" required hint="ตัวเลข 10 หลัก">
          <TextInput v-model="store.contactInfo.mobilePhone" type="tel" digits-only :maxlength="10" />
        </FormField>
        <FormField label="อีเมล (E-mail)">
          <TextInput v-model="store.contactInfo.email" type="email" />
        </FormField>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <FormField label="วัน/เดือน/ปีเกิด">
          <TextInput v-model="store.personalInfo.birthDate" type="date" />
        </FormField>
        <FormField label="อายุ (ปี)">
          <TextInput v-model="store.personalInfo.age" type="number" />
        </FormField>
        <FormField label="สัญชาติ">
          <TextInput v-model="store.personalInfo.nationality" />
        </FormField>
        <FormField label="เพศ">
          <SelectInput v-model="store.personalInfo.gender">
            <option value="">เลือก...</option>
            <option value="Male">ชาย (Male)</option>
            <option value="Female">หญิง (Female)</option>
          </SelectInput>
        </FormField>
        <FormField label="ภูมิลำเนา (Place of Birth)" class="sm:col-span-2">
          <TextInput v-model="store.personalInfo.placeOfBirth" />
        </FormField>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="บัตรประชาชนเลขที่" required hint="ตัวเลข 13 หลัก">
          <TextInput v-model="store.personalInfo.idCardNumber" digits-only :maxlength="13" />
        </FormField>
        <FormField label="วันที่ออกบัตร">
          <TextInput v-model="store.personalInfo.idCardIssueDate" type="date" />
        </FormField>
        <FormField label="วันหมดอายุ">
          <TextInput v-model="store.personalInfo.idCardExpiryDate" type="date" />
        </FormField>
      </div>

      <div v-if="store.personalInfo.prefix === 'นาย'">
        <FormField label="สถานภาพทางทหาร (Military Status)">
          <RadioPills v-model="store.personalInfo.militaryStatus" name="militaryStatus" :options="militaryStatusOptions" />
        </FormField>
      </div>
    </SectionCard>

    <SectionCard number="!" title="บุคคลที่สามารถติดต่อได้กรณีเร่งด่วน" subtitle="Emergency Contact">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="ชื่อ-นามสกุล">
          <TextInput v-model="store.skillsAndOther.emergencyContacts[0].name" />
        </FormField>
        <FormField label="ความสัมพันธ์ (Relations)">
          <TextInput v-model="store.skillsAndOther.emergencyContacts[0].relation" />
        </FormField>
        <FormField label="ที่อยู่/ที่ทำงาน (Address/Workplace)" class="sm:col-span-2">
          <TextInput v-model="store.skillsAndOther.emergencyContacts[0].address" />
        </FormField>
        <FormField label="โทรศัพท์ (Telephone)">
          <TextInput v-model="store.skillsAndOther.emergencyContacts[0].phone" digits-only :maxlength="10" />
        </FormField>
      </div>
    </SectionCard>
  </div>
</template>
