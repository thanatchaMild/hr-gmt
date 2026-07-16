<script setup lang="ts">
import { useOnboardingStore } from '~/stores/onboarding'
import SectionCard from '~/components/onboarding/ui/SectionCard.vue'
import FormField from '~/components/onboarding/ui/FormField.vue'
import TextInput from '~/components/onboarding/ui/TextInput.vue'
import SelectInput from '~/components/onboarding/ui/SelectInput.vue'
import TextareaInput from '~/components/onboarding/ui/TextareaInput.vue'
import RadioPills from '~/components/onboarding/ui/RadioPills.vue'
import RepeaterCard from '~/components/onboarding/ui/RepeaterCard.vue'
import AppButton from '~/components/onboarding/ui/AppButton.vue'

const store = useOnboardingStore()

function addLanguage() {
  store.skillsAndOther.languages.push({ language: '', speaking: '', reading: '', writing: '' })
}
function removeLanguage(index: number) {
  store.skillsAndOther.languages.splice(index, 1)
}

const levelOptions = [
  { value: 'Excellent', label: 'ดีมาก', subLabel: '(Excellent)' },
  { value: 'Good', label: 'ดี', subLabel: '(Good)' },
  { value: 'Fair', label: 'พอใช้', subLabel: '(Fair)' }
]
const canOptions = [
  { value: true, label: 'ได้', subLabel: '(Yes)' },
  { value: false, label: 'ไม่ได้', subLabel: '(No)' }
]
const ownOptions = [
  { value: true, label: 'มี', subLabel: '(Yes)' },
  { value: false, label: 'ไม่มี', subLabel: '(No)' }
]
const licenseOptions = [
  { value: true, label: 'มี', subLabel: '(Yes)' },
  { value: false, label: 'ไม่มี', subLabel: '(No)' }
]
const okOptions = [
  { value: false, label: 'ขัดข้อง', subLabel: '(No)' },
  { value: true, label: 'ไม่ขัดข้อง', subLabel: '(Yes)' }
]
const noYesOptions = [
  { value: false, label: 'ไม่เคย', subLabel: '(No)' },
  { value: true, label: 'เคย', subLabel: '(Yes)' }
]
const hasNotOptions = [
  { value: false, label: 'ไม่มี', subLabel: '(No)' },
  { value: true, label: 'มี', subLabel: '(Yes)' }
]
</script>

<template>
  <div class="space-y-5">
    <SectionCard number="6" title="ความสามารถพิเศษ" subtitle="Special Abilities">
      <p class="text-sm font-semibold text-slate-600">ความสามารถทางภาษา (Language Abilities)</p>
      <RepeaterCard v-for="(lang, index) in store.skillsAndOther.languages" :key="index" @remove="removeLanguage(index)">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <FormField label="ภาษา (Language)">
            <TextInput v-model="lang.language" placeholder="เช่น ภาษาอังกฤษ" />
          </FormField>
          <FormField label="พูด (Speaking)">
            <SelectInput v-model="lang.speaking">
              <option value="">เลือกระดับ...</option>
              <option v-for="o in levelOptions" :key="o.value" :value="o.value">{{ o.label }} ({{ o.subLabel }})</option>
            </SelectInput>
          </FormField>
          <FormField label="อ่าน (Reading)">
            <SelectInput v-model="lang.reading">
              <option value="">เลือกระดับ...</option>
              <option v-for="o in levelOptions" :key="o.value" :value="o.value">{{ o.label }} ({{ o.subLabel }})</option>
            </SelectInput>
          </FormField>
          <FormField label="เขียน (Writing)">
            <SelectInput v-model="lang.writing">
              <option value="">เลือกระดับ...</option>
              <option v-for="o in levelOptions" :key="o.value" :value="o.value">{{ o.label }} ({{ o.subLabel }})</option>
            </SelectInput>
          </FormField>
        </div>
      </RepeaterCard>
      <AppButton variant="secondary" size="sm" @click="addLanguage">
        <template #icon-left>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
        </template>
        เพิ่มภาษา
      </AppButton>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <FormField label="ความสามารถในการใช้คอมพิวเตอร์ / โปรแกรม">
          <TextareaInput v-model="store.skillsAndOther.computerAbility" :rows="2" />
        </FormField>
        <FormField label="ความสามารถอื่นๆ (Other Qualifications)">
          <TextareaInput v-model="store.skillsAndOther.otherQualifications" :rows="2" />
        </FormField>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div class="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
          <p class="text-sm font-semibold text-slate-700">ขับรถยนต์ (Drive Car)</p>
          <FormField label="ขับได้หรือไม่" compact>
            <RadioPills v-model="store.skillsAndOther.drivingCar.canDrive" name="carCanDrive" :options="canOptions" />
          </FormField>
          <FormField label="มีรถยนต์ส่วนตัว" compact>
            <RadioPills v-model="store.skillsAndOther.drivingCar.ownCar" name="carOwn" :options="ownOptions" />
          </FormField>
          <FormField label="ใบอนุญาตขับขี่" compact>
            <RadioPills v-model="store.skillsAndOther.drivingCar.hasLicense" name="carLicense" :options="licenseOptions" />
          </FormField>
          <FormField v-if="store.skillsAndOther.drivingCar.hasLicense" label="เลขที่ใบอนุญาตขับขี่รถยนต์" compact>
            <TextInput v-model="store.skillsAndOther.drivingCar.licenseNo" />
          </FormField>
        </div>
        <div class="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
          <p class="text-sm font-semibold text-slate-700">ขับรถจักรยานยนต์ (Ride Motorcycle)</p>
          <FormField label="ขับได้หรือไม่" compact>
            <RadioPills v-model="store.skillsAndOther.drivingMotorcycle.canDrive" name="mcCanDrive" :options="canOptions" />
          </FormField>
          <FormField label="มีรถจักรยานยนต์ส่วนตัว" compact>
            <RadioPills v-model="store.skillsAndOther.drivingMotorcycle.ownMotorcycle" name="mcOwn" :options="ownOptions" />
          </FormField>
          <FormField label="ใบอนุญาตขับขี่" compact>
            <RadioPills v-model="store.skillsAndOther.drivingMotorcycle.hasLicense" name="mcLicense" :options="licenseOptions" />
          </FormField>
          <FormField v-if="store.skillsAndOther.drivingMotorcycle.hasLicense" label="เลขที่ใบอนุญาตขับขี่รถจักรยานยนต์" compact>
            <TextInput v-model="store.skillsAndOther.drivingMotorcycle.licenseNo" />
          </FormField>
        </div>
      </div>
    </SectionCard>

    <SectionCard number="7" title="ข้อมูลทั่วไป" subtitle="General Data">
      <div class="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
        <p class="text-sm font-semibold text-slate-700">1. การไปปฏิบัติงานต่างจังหวัด (Can you work up country?)</p>
        <FormField label="เป็นการประจำ (Permanent)" compact>
          <RadioPills v-model="store.skillsAndOther.workUpCountry.permanent" name="upCountryPermanent" :options="okOptions" />
        </FormField>
        <FormField label="เป็นครั้งคราว (Temporary)" compact>
          <RadioPills v-model="store.skillsAndOther.workUpCountry.temporary" name="upCountryTemp" :options="okOptions" />
        </FormField>
      </div>

      <div class="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-4">
        <div>
          <p class="text-sm font-semibold text-slate-700 mb-2">2. การเจ็บป่วยขนาดหนัก หรือโรคติดต่อร้ายแรง</p>
          <RadioPills v-model="store.skillsAndOther.seriousIllness.hasHistory" name="illness" :options="noYesOptions" />
          <TextInput v-if="store.skillsAndOther.seriousIllness.hasHistory" v-model="store.skillsAndOther.seriousIllness.details" placeholder="โปรดระบุ" class="mt-2" />
        </div>
        <div>
          <FormField label="3. โรคประจำตัว หรือความบกพร่องทางร่างกาย">
            <TextInput v-model="store.skillsAndOther.physicalDisability" placeholder="ระบุถ้ามี..." />
          </FormField>
        </div>
      </div>

      <div class="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-4">
        <div>
          <p class="text-sm font-semibold text-slate-700 mb-2">4. เคยถูกจำคุก หรือต้องโทษทางอาญาหรือไม่</p>
          <RadioPills v-model="store.skillsAndOther.arrestHistory.hasHistory" name="arrest" :options="noYesOptions" />
          <TextInput v-if="store.skillsAndOther.arrestHistory.hasHistory" v-model="store.skillsAndOther.arrestHistory.reason" placeholder="โปรดระบุเหตุผล" class="mt-2" />
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-700 mb-2">5. เคยถูกให้ออกจากงานหรือเลิกจ้างหรือไม่</p>
          <RadioPills v-model="store.skillsAndOther.dischargeHistory.hasHistory" name="discharge" :options="noYesOptions" />
          <TextInput v-if="store.skillsAndOther.dischargeHistory.hasHistory" v-model="store.skillsAndOther.dischargeHistory.reason" placeholder="โปรดระบุเหตุผล" class="mt-2" />
        </div>
      </div>

      <div class="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-4">
        <div>
          <p class="text-sm font-semibold text-slate-700 mb-2">6. ท่านมีเพื่อนหรือญาติที่ทำงานที่บริษัทนี้หรือไม่</p>
          <RadioPills v-model="store.skillsAndOther.friendsInCompany.hasFriends" name="friends" :options="hasNotOptions" />
          <TextInput v-if="store.skillsAndOther.friendsInCompany.hasFriends" v-model="store.skillsAndOther.friendsInCompany.names" placeholder="โปรดระบุชื่อ" class="mt-2" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="7. ท่านทราบข่าวการสมัครงานจาก">
            <TextInput v-model="store.skillsAndOther.vacancySource" />
          </FormField>
          <FormField label="ชื่อผู้แนะนำ (Referrer's Name)">
            <TextInput v-model="store.skillsAndOther.referrerName" />
          </FormField>
        </div>
        <FormField label="8. ท่านมีหรือชอบงานอดิเรกอะไรบ้าง">
          <TextInput v-model="store.skillsAndOther.hobbies" />
        </FormField>
      </div>
    </SectionCard>

    <SectionCard number="8" title="ข้อมูลเพิ่มเติม" subtitle="Further Information">
      <FormField label="ข้อมูลเพิ่มเติมซึ่งท่านคิดว่าจะเป็นประโยชน์ต่อการสมัครงาน">
        <TextareaInput v-model="store.skillsAndOther.furtherInformation" :rows="3" />
      </FormField>
    </SectionCard>
  </div>
</template>
