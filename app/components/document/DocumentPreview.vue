<script setup lang="ts">
import { useOnboardingStore } from '~/stores/onboarding'
import { pdpaHtml } from '~/utils/pdpaContent'
import { consentHtml } from '~/utils/consentContent'
import { hireTypeLabel } from '~/utils/hireType'
import { computed } from 'vue'

const store = useOnboardingStore()

const cleanPdpaHtml = computed(() => {
  let html = pdpaHtml
  // Strip custom background circles from numbers
  html = html.replace(/<span class="[^"]*w-8 h-8[^"]*">(\d+)<\/span>/g, '$1. ')
  // Fix the stray "t"
  html = html.replace(/>t/g, '>')
  // Replace SVGs with arrow bullets
  html = html.replace(/<svg\b[^>]*>.*?<\/svg>/gs, '<span style="margin-right: 6px;">➢</span>')
  // Strip ALL class attributes
  html = html.replace(/ class="[^"]*"/g, '')
  // Replace strong with bold so it doesn't get wiped by class strip if it relied on classes
  return html
})

// Splits `html` into consecutive chunks at each marker (each chunk starts with its marker,
// except the first). Used to lay long legal text across multiple print pages.
function splitBySections(html: string, markers: string[]): string[] {
  const chunks: string[] = []
  let remaining = html
  for (const marker of markers) {
    const idx = remaining.indexOf(marker)
    if (idx === -1) {
      chunks.push(remaining)
      remaining = ''
      continue
    }
    chunks.push(remaining.slice(0, idx))
    remaining = remaining.slice(idx)
  }
  chunks.push(remaining)
  return chunks
}

// 3 physical pages total. Section 3's bullet list is by far the longest section, and section 11's
// rights list is the next longest, so pages are balanced by content weight rather than an even
// 1-3/4-7/8-11 section split: page A = sections 1-3, page B = sections 4-9, page C = sections 10-11
// (12 is hardcoded in the template, alongside the signature)
const pdpaChunks = computed(() => splitBySections(cleanPdpaHtml.value, [
  '<h3>4. ข้อมูลส่วนบุคคลที่มีความอ่อนไหว</h3>',
  '<h3>10. มาตรการความปลอดภัยสำหรับข้อมูลส่วนบุคคล</h3>',
  '<h3>12. ข้อมูลเกี่ยวกับผู้ควบคุมข้อมูลส่วนบุคคลและเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล</h3>'
]))

const cleanPdpaHtmlPartA = computed(() => pdpaChunks.value[0]) // sections 1-3
const cleanPdpaHtmlPartB = computed(() => pdpaChunks.value[1]) // sections 4-9
const cleanPdpaHtmlPartC = computed(() => pdpaChunks.value[2]) // sections 10-11

const cleanConsentHtml = computed(() => {
  let html = consentHtml
  html = html.replace(/<span class="[^"]*w-8 h-8[^"]*">(\d+)<\/span>/g, '$1. ')
  html = html.replace(/>พื่อ/g, '>เพื่อ') // Fix typo in original text if any (the original has 'พื่อ' instead of 'เพื่อ')
  html = html.replace(/<svg\b[^>]*>.*?<\/svg>/gs, '<span style="margin-right: 6px;">➢</span>')
  html = html.replace(/ class="[^"]*"/g, '')
  return html
})

// 2 physical pages, matching FM-HRS-03.pdf's page 7/8 grouping: page A = sections 1-2, page B = section 3
const consentChunks = computed(() => splitBySections(cleanConsentHtml.value, [
  '<h3>3. ข้อมูลส่วนบุคคลที่มีความอ่อนไหว</h3>'
]))

const cleanConsentHtmlPartA = computed(() => consentChunks.value[0]) // sections 1-2
const cleanConsentHtmlPartB = computed(() => consentChunks.value[1]) // section 3

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
}

const printDocument = () => {
  window.print()
}
</script>

<template>
  <div class="preview-container bg-gray-100 py-8 print:py-0 print:bg-white flex flex-col items-center">
    
    <!-- Action Bar -->
    <div class="w-[21cm] flex justify-end mb-4 print:hidden">
      <button @click="printDocument" class="px-5 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
        พิมพ์ใบสมัคร (Print)
      </button>
    </div>

    <!-- PAGE 1 -->
    <div class="page bg-white px-[1.5cm] pt-[1.5cm] pb-[2cm] w-[21cm] min-h-[29.5cm] mx-auto shadow-2xl mb-8 print:shadow-none print:mb-0 print:break-after-page text-[12px] leading-snug font-sans text-black relative flex flex-col justify-between">
      <div class="content flex-1">
        
        <!-- Header -->
        <div class="flex justify-between items-start mb-1">
          <div class="w-1/3">
            <img src="/logo_form.jpg" alt="Logo" class="h-12 object-contain">
          </div>
          <div class="w-1/3 text-center flex flex-col items-center justify-center">
            <div class="font-bold text-sm tracking-wide">ใบสมัครงาน</div>
            <div class="text-[11px] uppercase mt-0.5">APPLICATION FORM</div>
          </div>
          <div class="w-1/3 flex justify-end">
            <div class="w-[2.2cm] h-[2.8cm] border border-black flex flex-col items-center justify-center text-center text-xs text-gray-700">
              <div class="text-[10px]">ติดรูปถ่ายหน้าตรง</div>
              <div class="mt-1 text-[10px]">Photo</div>
            </div>
          </div>
        </div>

        <div class="mb-1 text-[11px] text-gray-700">
          โปรดกรอกข้อความในใบสมัครโดยละเอียดและครบถ้วน / Please complete the following form and state details.
        </div>

        <!-- Position Applied Box -->
        <div class="border-2 border-black w-full mb-1 text-[12px]">
          <div class="border-b border-black px-2 py-1 font-bold">
            ตำแหน่งที่ต้องการสมัคร
          </div>
          <div class="flex border-b border-black">
            <div class="w-full px-2 py-1 flex gap-2 items-center">
              <span>Position Application 1. </span>
              <span class="border-b border-dotted border-black flex-1 text-center font-medium text-blue-800">
                {{ store.personalInfo.positionApplied }}
              </span>
              <span>2. </span>
              <span class="border-b border-dotted border-black flex-1 text-center font-medium text-blue-800">
                {{ hireTypeLabel(store.hireType) }}
              </span>
            </div>
          </div>
          <div class="flex">
            <div class="w-1/2 p-1 border-r border-black bg-gray-50"></div>
            <div class="w-1/2 px-2 py-1 flex gap-2">
              <span>วันที่พร้อมจะเริ่มงานได้/Starting Date</span>
              <span class="border-b border-dotted border-black flex-1 text-center font-medium text-blue-800">
                {{ store.personalInfo.availableStartDate ? formatDate(store.personalInfo.availableStartDate) : '' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 1. PERSONAL DETAILS -->
        <div class="mb-2 text-[11.5px]">
          <div class="font-bold mb-1 text-[12.5px]">1. ประวัติส่วนตัว PERSONAL DETAILS</div>
          <table class="w-full border-collapse border-[1.5px] border-black text-left">
            <tbody>
              <tr>
                <td colspan="3" class="border border-black px-2 py-0.5">
                  ชื่อ-นามสกุล (นาย/นาง/นางสาว) (ภาษาไทย)
                  <span class="font-medium text-blue-800 ml-4">{{ store.personalInfo.prefix }} {{ store.personalInfo.firstName }} {{ store.personalInfo.lastName }}</span>
                </td>
              </tr>
              <tr>
                <td colspan="3" class="border border-black px-2 py-0.5">
                  Name-Surname (Mr./Mrs./Miss) (English)
                  <span class="font-medium text-blue-800 ml-4">{{ store.personalInfo.prefixEn }} {{ store.personalInfo.firstNameEn }} {{ store.personalInfo.lastNameEn }}</span>
                </td>
              </tr>
              <tr>
                <td colspan="3" class="border border-black px-2 py-0.5">
                  ที่อยู่ปัจจุบัน/Present Address
                  <span class="font-medium text-blue-800 ml-4">{{ store.contactInfo.presentAddress }}</span>
                </td>
              </tr>
              <tr>
                <td colspan="3" class="border border-black px-2 py-0.5">
                  ที่อยู่ตามทะเบียนบ้าน/ Permanent Address
                  <span class="font-medium text-blue-800 ml-4">{{ store.contactInfo.permanentAddress }}</span>
                </td>
              </tr>
              <tr>
                <td class="border border-black px-2 py-0.5 w-1/3">
                  <div class="mb-0.5">โทรศัพท์<br><span class="text-[10px]">Telephone Home</span></div>
                  <div class="text-center font-medium text-blue-800">{{ store.contactInfo.homePhone || '-' }}</div>
                </td>
                <td class="border border-black px-2 py-0.5 w-1/3">
                  <div class="mb-0.5">โทรศัพท์มือถือ<br><span class="text-[10px]">Mobile Phone</span></div>
                  <div class="text-center font-medium text-blue-800">{{ store.contactInfo.mobilePhone || '-' }}</div>
                </td>
                <td class="border border-black px-2 py-0.5 w-1/3">
                  <div class="mb-0.5">อีเมล์<br><span class="text-[10px]">E-mail</span></div>
                  <div class="text-center font-medium text-blue-800">{{ store.contactInfo.email || '-' }}</div>
                </td>
              </tr>
              <tr>
                <td class="border border-black px-2 py-0.5">
                  <div class="flex justify-between">
                    <div>วัน เดือน ปีเกิด<br><span class="text-[10px]">Date of Birth</span></div>
                    <div class="font-medium text-blue-800 self-end">{{ formatDate(store.personalInfo.birthDate) }}</div>
                  </div>
                </td>
                <td class="border border-black px-2 py-0.5">
                  <div class="flex justify-between">
                    <div>อายุ<br><span class="text-[10px]">Age</span></div>
                    <div class="font-medium text-blue-800 self-end">{{ store.personalInfo.age }} ปี</div>
                  </div>
                </td>
                <td class="border border-black px-2 py-0.5">
                  <div class="flex justify-between">
                    <div>สัญชาติ<br><span class="text-[10px]">Nationality</span></div>
                    <div class="font-medium text-blue-800 self-end">{{ store.personalInfo.nationality }}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colspan="2" class="border border-black px-2 py-0.5">
                  เพศ/Sex <span class="font-medium text-blue-800 ml-4">{{ store.personalInfo.gender }}</span>
                </td>
                <td class="border border-black px-2 py-0.5">
                  ภูมิลำเนา/Place of Birth <span class="font-medium text-blue-800 ml-2">-</span>
                </td>
              </tr>
              <tr>
                <td class="border border-black px-2 py-0.5">
                  <div class="mb-1">บัตรประชาชนเลขที่<br><span class="text-[10px]">Identification Card No.</span></div>
                  <div class="text-center font-medium text-blue-800">{{ store.personalInfo.idCardNumber }}</div>
                </td>
                <td class="border border-black px-2 py-0.5">
                  <div class="mb-1">วันที่ออกบัตร<br><span class="text-[10px]">Issued Date</span></div>
                  <div class="text-center font-medium text-blue-800">{{ formatDate(store.personalInfo.idCardIssueDate) }}</div>
                </td>
                <td class="border border-black px-2 py-0.5">
                  <div class="mb-1">วันหมดอายุ<br><span class="text-[10px]">Expiry Date</span></div>
                  <div class="text-center font-medium text-blue-800">{{ formatDate(store.personalInfo.idCardExpiryDate) }}</div>
                </td>
              </tr>
              <tr>
                <td colspan="3" class="border border-black px-2 py-0.5">
                  <div class="flex items-center w-full">
                    <div class="w-[20%]">
                      <div class="font-bold">สถานภาพทางทหาร</div>
                      <div class="text-[10px]">Military Status</div>
                    </div>
                    <div class="w-[80%] flex justify-between items-start text-[11px]">
                      <label class="flex items-start gap-1">
                        <input type="checkbox" class="mt-0.5" disabled :checked="store.personalInfo.militaryStatus === 'ผ่านการเกณฑ์ทหารแล้ว'">
                        <div class="leading-tight">
                          <div>ผ่านการเกณฑ์ทหาร</div>
                          <div class="text-[10px]">Exempted</div>
                        </div>
                      </label>
                      <label class="flex items-start gap-1">
                        <input type="checkbox" class="mt-0.5" disabled :checked="store.personalInfo.militaryStatus === 'ได้รับการยกเว้น'">
                        <div class="leading-tight">
                          <div>ยังไม่ผ่านการเกณฑ์ทหาร</div>
                          <div class="text-[10px]">Non Exempted</div>
                        </div>
                      </label>
                      <label class="flex items-start gap-1">
                        <input type="checkbox" class="mt-0.5" disabled :checked="store.personalInfo.militaryStatus === 'ศึกษาวิชาทหาร'">
                        <div class="leading-tight">
                          <div>เรียนรักษาดินแดน</div>
                          <div class="text-[10px]">Territorial Degree Student</div>
                        </div>
                      </label>
                      <label class="flex items-start gap-1">
                        <input type="checkbox" class="mt-0.5" disabled :checked="store.personalInfo.militaryStatus === 'รับราชการทหารแล้ว'">
                        <div class="leading-tight">
                          <div>รับราชการทหารแล้ว</div>
                          <div class="text-[10px]">Date Entered Service</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td colspan="3" class="border border-black px-2 py-0.5">
                  <table class="w-full text-[11.5px] border-none">
                    <tr>
                      <td class="w-[60%] align-top">
                        บุคคลที่สามารถติดต่อได้กรณีเร่งด่วน ชื่อ-นามสกุล<br>
                        <span class="text-[10px]">In case of emergency please contact &nbsp; Name-Surname</span>
                        <span class="font-medium text-blue-800 ml-2">{{ store.skillsAndOther.emergencyContacts?.[0]?.name || '-' }}</span>
                        <br>
                        <span>ที่อยู่ที่ทำงาน</span>
                        <span class="text-[10px]">Address/Workplace</span>
                        <span class="font-medium text-blue-800 ml-2">{{ store.skillsAndOther.emergencyContacts?.[0]?.address || '-' }}</span>
                      </td>
                      <td class="w-[40%] align-top">
                        <div>
                          ความสัมพันธ์<span class="text-[10px] ml-1">Relations</span>
                          <span class="font-medium text-blue-800 ml-2">{{ store.skillsAndOther.emergencyContacts?.[0]?.relation || '-' }}</span>
                        </div>
                        <div>
                          โทรศัพท์<span class="text-[10px] ml-1">Telephone</span>
                          <span class="font-medium text-blue-800 ml-2">{{ store.skillsAndOther.emergencyContacts?.[0]?.phone || '-' }}</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 2. FAMILY DETAILS -->
        <div class="mb-2 text-[11.5px]">
          <div class="font-bold mb-1 text-[12.5px]">2. รายละเอียดครอบครัว FAMILY DETAILS</div>
          <table class="w-full border-collapse border-[1.5px] border-black text-center">
            <tbody>
              <tr>
                <td colspan="5" class="border border-black px-2 py-1 text-left">
                  <div class="flex items-center w-full">
                    <div class="w-[20%]">
                      <div class="font-bold">สถานภาพสมรส</div>
                      <div class="text-[10px]">Marital Status</div>
                    </div>
                    <div class="w-[80%] flex justify-between items-start text-[11px] pr-4">
                      <label class="flex items-start gap-1">
                        <input type="checkbox" class="mt-0.5" disabled :checked="store.familyInfo.maritalStatus === 'โสด'">
                        <div class="leading-tight">
                          <div>โสด</div>
                          <div class="text-[10px]">Single</div>
                        </div>
                      </label>
                      <label class="flex items-start gap-1">
                        <input type="checkbox" class="mt-0.5" disabled :checked="store.familyInfo.maritalStatus === 'สมรส'">
                        <div class="leading-tight">
                          <div>สมรส</div>
                          <div class="text-[10px]">Married</div>
                        </div>
                      </label>
                      <label class="flex items-start gap-1">
                        <input type="checkbox" class="mt-0.5" disabled :checked="store.familyInfo.maritalStatus === 'แยกกันอยู่'">
                        <div class="leading-tight">
                          <div>แยกกันอยู่</div>
                          <div class="text-[10px]">Separated</div>
                        </div>
                      </label>
                      <label class="flex items-start gap-1">
                        <input type="checkbox" class="mt-0.5" disabled :checked="store.familyInfo.maritalStatus === 'หย่า'">
                        <div class="leading-tight">
                          <div>หย่า</div>
                          <div class="text-[10px]">Divorced</div>
                        </div>
                      </label>
                      <label class="flex items-start gap-1">
                        <input type="checkbox" class="mt-0.5" disabled :checked="store.familyInfo.maritalStatus === 'หม้าย'">
                        <div class="leading-tight">
                          <div>หม้าย</div>
                          <div class="text-[10px]">Widowed</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </td>
              </tr>
              <tr class="bg-gray-50">
                <td class="border border-black px-2 py-0.5 w-[15%]">ครอบครัว<br><span class="text-[10px]">Family Details</span></td>
                <td class="border border-black px-2 py-0.5 w-[30%]">ชื่อ-นามสกุล<br><span class="text-[10px]">Name-Surname</span></td>
                <td class="border border-black px-2 py-0.5 w-[10%]">อายุ<br><span class="text-[10px]">Age</span></td>
                <td class="border border-black px-2 py-0.5 w-[25%]">อาชีพ/ตำแหน่ง<br><span class="text-[10px]">Occupation/Position</span></td>
                <td class="border border-black px-2 py-0.5 w-[20%]">โทรศัพท์<br><span class="text-[10px]">Telephone</span></td>
              </tr>
              <tr>
                <td class="border border-black px-2 py-0.5 text-left">บิดา/Father</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.father.name }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.father.age }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.father.occupation }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.father.phone }}</td>
              </tr>
              <tr>
                <td class="border border-black px-2 py-0.5 text-left">มารดา/Mother</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.mother.name }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.mother.age }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.mother.occupation }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.mother.phone }}</td>
              </tr>
              <tr>
                <td class="border border-black px-2 py-0.5 text-left align-top" rowspan="4">พี่น้อง...............คน<br><span class="text-[10px]">Brother/Sister</span></td>
                <td class="border border-black px-2 py-0.5 text-left">1. <span class="font-medium text-blue-800">{{ store.familyInfo.siblings[0]?.name || '' }}</span></td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.siblings[0]?.age || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.siblings[0]?.occupation || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.siblings[0]?.phone || '' }}</td>
              </tr>
              <tr>
                <td class="border border-black px-2 py-0.5 text-left">2. <span class="font-medium text-blue-800">{{ store.familyInfo.siblings[1]?.name || '' }}</span></td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.siblings[1]?.age || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.siblings[1]?.occupation || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.siblings[1]?.phone || '' }}</td>
              </tr>
              <tr>
                <td class="border border-black px-2 py-0.5 text-left">3. <span class="font-medium text-blue-800">{{ store.familyInfo.siblings[2]?.name || '' }}</span></td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.siblings[2]?.age || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.siblings[2]?.occupation || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.siblings[2]?.phone || '' }}</td>
              </tr>
              <tr>
                <td class="border border-black px-2 py-0.5 text-left">4. <span class="font-medium text-blue-800">{{ store.familyInfo.siblings[3]?.name || '' }}</span></td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.siblings[3]?.age || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.siblings[3]?.occupation || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.siblings[3]?.phone || '' }}</td>
              </tr>
              <tr>
                <td class="border border-black px-2 py-0.5 text-left">คู่สมรส/Spouse</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.spouse.name }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.spouse.age }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.spouse.occupation }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.spouse.phone }}</td>
              </tr>
              <tr>
                <td class="border border-black px-2 py-0.5 text-left align-top" rowspan="2">จำนวนบุตร..........คน<br><span class="text-[10px]">Number of Children</span></td>
                <td class="border border-black px-2 py-0.5 text-left">1. <span class="font-medium text-blue-800">{{ store.familyInfo.children[0]?.name || '' }}</span></td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.children[0]?.age || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.children[0]?.occupation || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.children[0]?.phone || '' }}</td>
              </tr>
              <tr>
                <td class="border border-black px-2 py-0.5 text-left">2. <span class="font-medium text-blue-800">{{ store.familyInfo.children[1]?.name || '' }}</span></td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.children[1]?.age || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.children[1]?.occupation || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.familyInfo.children[1]?.phone || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Footer Page 1 -->
      <div class="flex justify-end text-[10.5px] mt-2">
        1/8
      </div>
    </div>


    <!-- PAGE 2 -->
    <div class="page bg-white px-[1.5cm] pt-[1.5cm] pb-[2cm] w-[21cm] min-h-[29.5cm] mx-auto shadow-2xl mb-8 print:shadow-none print:mb-0 print:break-after-page text-[12px] leading-snug font-sans text-black relative flex flex-col justify-between">
      <div class="content flex-1 space-y-2">
        <!-- 3. Education -->
        <div class="text-[11.5px]">
          <div class="font-bold text-[12.5px] mb-1">3. ประวัติการศึกษา EDUCATION BACKGROUND</div>
          <table class="w-full border-collapse border-[1.5px] border-black text-center">
            <thead class="bg-gray-50">
              <tr>
                <th class="border border-black px-2 py-0.5 w-[22%]">ระดับการศึกษา<br><span class="text-[10px] font-normal">Level</span></th>
                <th class="border border-black px-2 py-0.5 w-[20%]">สถานศึกษา/จังหวัด<br><span class="text-[10px] font-normal">Institute/District</span></th>
                <th class="border border-black px-2 py-0.5 w-[18%]">วุฒิการศึกษา<br><span class="text-[10px] font-normal">Degree/Certificate</span></th>
                <th class="border border-black px-2 py-0.5 w-[20%]">คณะ/วิชาเอก<br><span class="text-[10px] font-normal">Faculty/Major</span></th>
                <th class="border border-black px-2 py-0.5 w-[10%]">ปีที่จบ<br><span class="text-[10px] font-normal">Graduated</span></th>
                <th class="border border-black px-2 py-0.5 w-[10%]">คะแนนเฉลี่ย<br><span class="text-[10px] font-normal">GPA</span></th>
              </tr>
            </thead>
            <tbody>
              <!-- Secondary -->
              <tr>
                <td class="border border-black px-2 py-0.5 text-left">มัธยมศึกษาตอนต้น<br><span class="text-[10px]">secondary</span></td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ตอนต้น'))?.institution || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ตอนต้น'))?.degree || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ตอนต้น'))?.major || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ตอนต้น'))?.graduatedYear || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ตอนต้น'))?.gpa || '' }}</td>
              </tr>
              <!-- High School -->
              <tr>
                <td class="border border-black px-2 py-0.5 text-left">มัธยมศึกษาตอนปลาย/ปวช.<br><span class="text-[10px]">High School/Vocational</span></td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ตอนปลาย') || r.level.includes('ปวช'))?.institution || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ตอนปลาย') || r.level.includes('ปวช'))?.degree || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ตอนปลาย') || r.level.includes('ปวช'))?.major || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ตอนปลาย') || r.level.includes('ปวช'))?.graduatedYear || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ตอนปลาย') || r.level.includes('ปวช'))?.gpa || '' }}</td>
              </tr>
              <!-- Diploma -->
              <tr>
                <td class="border border-black px-2 py-0.5 text-left">อนุปริญญา/ปวส.<br><span class="text-[10px]">Diploma/Higher Vocational</span></td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('อนุปริญญา') || r.level.includes('ปวส'))?.institution || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('อนุปริญญา') || r.level.includes('ปวส'))?.degree || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('อนุปริญญา') || r.level.includes('ปวส'))?.major || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('อนุปริญญา') || r.level.includes('ปวส'))?.graduatedYear || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('อนุปริญญา') || r.level.includes('ปวส'))?.gpa || '' }}</td>
              </tr>
              <!-- Bachelor -->
              <tr>
                <td class="border border-black px-2 py-0.5 text-left">ปริญญาตรี/Bachelor Degree</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ปริญญาตรี'))?.institution || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ปริญญาตรี'))?.degree || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ปริญญาตรี'))?.major || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ปริญญาตรี'))?.graduatedYear || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ปริญญาตรี'))?.gpa || '' }}</td>
              </tr>
              <!-- Master -->
              <tr>
                <td class="border border-black px-2 py-0.5 text-left">ปริญญาโท/Master Degree</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ปริญญาโท'))?.institution || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ปริญญาโท'))?.degree || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ปริญญาโท'))?.major || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ปริญญาโท'))?.graduatedYear || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('ปริญญาโท'))?.gpa || '' }}</td>
              </tr>
              <!-- Other -->
              <tr>
                <td class="border border-black px-2 py-0.5 text-left">อื่น ๆ/Other</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('อื่น ๆ'))?.institution || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('อื่น ๆ'))?.degree || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('อื่น ๆ'))?.major || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('อื่น ๆ'))?.graduatedYear || '' }}</td>
                <td class="border border-black px-2 py-0.5 font-medium text-blue-800">{{ store.educationHistory.records.find(r => r.level.includes('อื่น ๆ'))?.gpa || '' }}</td>
              </tr>
              <!-- Continuing Studies -->
              <tr>
                <td colspan="6" class="border border-black px-2 py-0.5 text-left border-t-[1.5px]">
                  <div class="flex items-center flex-wrap gap-x-4 gap-y-1 w-full">
                    <span>ท่านจะศึกษาต่อหรือไม่/Are you continuing your studies?</span>
                    <div class="flex items-center gap-4">
                      <label class="flex items-center gap-1"><input type="checkbox" class="mt-0.5" disabled :checked="store.educationHistory.continuingStudies === false"> ไม่/No</label>
                      <label class="flex items-center gap-1"><input type="checkbox" class="mt-0.5" disabled :checked="store.educationHistory.continuingStudies === true"> เรียนต่อ (อธิบาย)/Yes (Explain)</label>
                    </div>
                    <span class="border-b border-dotted border-black flex-1 font-medium text-blue-800 min-w-[100px]">{{ store.educationHistory.continuingStudies ? store.educationHistory.continuingDetails : '' }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 4. Training (Empty to match image) -->
        <div class="text-[11.5px]">
          <div class="font-bold text-[12.5px] mb-1">4. ประวัติการฝึกอบรม/ดูงาน/ฝึกงาน JOB TRAINING/INSPECTION/APPRENTICESHIP</div>
          <table class="w-full border-collapse border-[1.5px] border-black text-center">
            <thead class="bg-gray-50">
              <tr>
                <th class="border border-black px-2 py-1 w-[25%]">ชื่อหลักสูตร/Course</th>
                <th class="border border-black px-2 py-1 w-[30%]">สถาบัน/Institute</th>
                <th class="border border-black px-2 py-1 w-[20%]">วุฒิที่ได้รับ/<br><span class="text-[10px] font-normal">Degree/Certificate</span></th>
                <th class="border border-black px-2 py-1 w-[15%]">ระยะเวลา/Period</th>
                <th class="border border-black px-2 py-1 w-[10%]">ปี/Year</th>
              </tr>
            </thead>
            <tbody>
              <tr><td class="border border-black px-2 py-1 h-6"></td><td class="border border-black px-2 py-1"></td><td class="border border-black px-2 py-1"></td><td class="border border-black px-2 py-1"></td><td class="border border-black px-2 py-1"></td></tr>
              <tr><td class="border border-black px-2 py-1 h-6"></td><td class="border border-black px-2 py-1"></td><td class="border border-black px-2 py-1"></td><td class="border border-black px-2 py-1"></td><td class="border border-black px-2 py-1"></td></tr>
              <tr><td class="border border-black px-2 py-1 h-6"></td><td class="border border-black px-2 py-1"></td><td class="border border-black px-2 py-1"></td><td class="border border-black px-2 py-1"></td><td class="border border-black px-2 py-1"></td></tr>
            </tbody>
          </table>
        </div>

        <!-- 5. Employment -->
        <div class="text-[11.5px]">
          <div class="font-bold text-[12.5px] mb-1">5. ประวัติการทำงาน (เรียงจากปัจจุบันไปหาอดีต) EMPLOYMENT (LIST LAST EMPLOYMENT FIRST)</div>
          
          <div v-for="(work, idx) in Math.max(2, store.workHistory.length)" :key="'work'+idx" class="w-full border-[1.5px] border-black text-[11px] mb-2">
            <div v-if="store.workHistory[idx]">
              <!-- Row 1 -->
              <div class="flex border-b border-black">
                <div class="w-[65%] border-r border-black p-1.5">
                  <div class="flex gap-2">
                    <span class="whitespace-nowrap">{{ idx + 1 }}. ชื่อบริษัท</span>
                    <span class="font-medium text-blue-800">{{ store.workHistory[idx].company }}</span>
                  </div>
                  <div class="text-[10px] mt-0.5">Company's Name</div>
                </div>
                <div class="w-[35%] p-1.5">
                  <div class="flex gap-2">
                    <span class="whitespace-nowrap">ประเภทธุรกิจ</span>
                    <span class="font-medium text-blue-800">{{ store.workHistory[idx].businessType }}</span>
                  </div>
                  <div class="text-[10px] mt-0.5">Type of Business</div>
                </div>
              </div>
              <!-- Row 2 -->
              <div class="flex border-b border-black">
                <div class="w-[65%] border-r border-black p-1.5">
                  <div class="flex gap-2">
                    <span class="whitespace-nowrap">ที่อยู่</span>
                    <span class="font-medium text-blue-800">{{ store.workHistory[idx].address }}</span>
                  </div>
                  <div class="text-[10px] mt-0.5">Address</div>
                </div>
                <div class="w-[35%] p-1.5">
                  <div class="flex gap-2">
                    <span class="whitespace-nowrap">โทรศัพท์</span>
                    <span class="font-medium text-blue-800">{{ store.workHistory[idx].phone }}</span>
                  </div>
                  <div class="text-[10px] mt-0.5">Telephone</div>
                </div>
              </div>
              <!-- Row 3 -->
              <div class="border-b border-black p-1.5 min-h-[26px]">
                <div class="flex gap-2">
                  <span class="whitespace-nowrap">ลักษณะงานที่รับผิดชอบโดยย่อ</span>
                  <span class="font-medium text-blue-800">{{ store.workHistory[idx].responsibility }}</span>
                </div>
                <div class="text-[10px] mt-0.5">Brief Responsibility</div>
              </div>
              <!-- Row 4 Header -->
              <div class="flex border-b border-black bg-gray-50">
                <div class="w-[35%] border-r border-black flex">
                  <div class="w-1/2 p-1.5">
                    <div>วันเริ่มงาน</div>
                    <div class="text-[10px] mt-0.5">Date Employed</div>
                  </div>
                  <div class="w-1/2 p-1.5 text-center">
                    <div>ถึง</div>
                    <div class="text-[10px] mt-0.5">To</div>
                  </div>
                </div>
                <div class="w-[30%] border-r border-black p-1.5">
                  <div>ตำแหน่งแรกเข้า</div>
                  <div class="text-[10px] mt-0.5">First Position</div>
                </div>
                <div class="w-[35%] p-1.5">
                  <div>ตำแหน่งสุดท้าย</div>
                  <div class="text-[10px] mt-0.5">Last Position</div>
                </div>
              </div>
              <!-- Row 5 Data -->
              <div class="flex border-b border-black h-6 text-blue-800 font-medium">
                <div class="w-[17.5%] p-1.5">{{ store.workHistory[idx].startDate }}</div>
                <div class="w-[17.5%] border-r border-black p-1.5 text-center">{{ store.workHistory[idx].endDate }}</div>
                <div class="w-[30%] border-r border-black p-1.5">{{ store.workHistory[idx].firstPosition }}</div>
                <div class="w-[35%] p-1.5">{{ store.workHistory[idx].lastPosition }}</div>
              </div>
              <!-- Row 6 -->
              <div class="p-1.5 flex gap-2">
                <span class="whitespace-nowrap">เหตุผลที่ออกจากงาน/Reason For Leaving</span>
                <span class="font-medium text-blue-800">{{ store.workHistory[idx].reasonForLeaving }}</span>
              </div>
            </div>

            <!-- Blank template for empty jobs (always show at least 2) -->
            <div v-else>
              <div class="flex border-b border-black">
                <div class="w-[65%] border-r border-black p-1.5"><div class="flex gap-2"><span>{{ idx + 1 }}. ชื่อบริษัท</span></div><div class="text-[10px] mt-0.5">Company's Name</div></div>
                <div class="w-[35%] p-1.5"><div class="flex gap-2"><span>ประเภทธุรกิจ</span></div><div class="text-[10px] mt-0.5">Type of Business</div></div>
              </div>
              <div class="flex border-b border-black">
                <div class="w-[65%] border-r border-black p-1.5"><div class="flex gap-2"><span>ที่อยู่</span></div><div class="text-[10px] mt-0.5">Address</div></div>
                <div class="w-[35%] p-1.5"><div class="flex gap-2"><span>โทรศัพท์</span></div><div class="text-[10px] mt-0.5">Telephone</div></div>
              </div>
              <div class="border-b border-black p-1.5 min-h-[26px]">
                <div class="flex gap-2"><span>ลักษณะงานที่รับผิดชอบโดยย่อ</span></div><div class="text-[10px] mt-0.5">Brief Responsibility</div>
              </div>
              <div class="flex border-b border-black bg-gray-50">
                <div class="w-[35%] border-r border-black flex">
                  <div class="w-1/2 p-1.5"><div>วันเริ่มงาน</div><div class="text-[10px] mt-0.5">Date Employed</div></div>
                  <div class="w-1/2 p-1.5 text-center"><div>ถึง</div><div class="text-[10px] mt-0.5">To</div></div>
                </div>
                <div class="w-[30%] border-r border-black p-1.5"><div>ตำแหน่งแรกเข้า</div><div class="text-[10px] mt-0.5">First Position</div></div>
                <div class="w-[35%] p-1.5"><div>ตำแหน่งสุดท้าย</div><div class="text-[10px] mt-0.5">Last Position</div></div>
              </div>
              <div class="flex border-b border-black h-6">
                <div class="w-[17.5%] p-1.5"></div><div class="w-[17.5%] border-r border-black p-1.5 text-center"></div>
                <div class="w-[30%] border-r border-black p-1.5"></div><div class="w-[35%] p-1.5"></div>
              </div>
              <div class="p-1.5 flex gap-2">
                <span class="whitespace-nowrap">เหตุผลที่ออกจากงาน/Reason For Leaving</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Footer Page 2 -->
      <div class="flex justify-end text-[10.5px] mt-2">
        2/8
      </div>
    </div>


    <!-- PAGE 3 -->
    <div class="page bg-white px-[1.5cm] pt-[1.5cm] pb-[2cm] w-[21cm] min-h-[29.5cm] mx-auto shadow-2xl mb-8 print:shadow-none print:mb-0 print:break-after-page text-[12px] leading-snug font-sans text-black relative flex flex-col justify-between">
      <div class="content flex-1 space-y-1">
        <!-- 6. Special Abilities -->
        <div class="text-[11.5px]">
          <div class="font-bold text-[12.5px] mb-1">6. ความสามารถพิเศษ SPECIAL ABILITIES</div>
          <table class="w-full border-collapse border-[1.5px] border-black text-center text-[11px]">
            <tbody>
              <tr>
                <td rowspan="2" class="border border-black w-[28%] bg-gray-50 p-1">ความสามารถทางภาษา<br><span class="text-[10px] font-normal">Language Abilities</span></td>
                <td colspan="3" class="border border-black w-[24%] bg-gray-50 p-1">พูด/Speaking</td>
                <td colspan="3" class="border border-black w-[24%] bg-gray-50 p-1">อ่าน/Reading</td>
                <td colspan="3" class="border border-black w-[24%] bg-gray-50 p-1">เขียน/Writing</td>
              </tr>
              <tr class="text-[9.5px] bg-gray-50">
                <td class="border border-black p-1 w-[8%]">ดีมาก/Exc.</td>
                <td class="border border-black p-1 w-[8%]">ดี/Good</td>
                <td class="border border-black p-1 w-[8%]">พอใช้/Fair</td>
                <td class="border border-black p-1 w-[8%]">ดีมาก/Exc.</td>
                <td class="border border-black p-1 w-[8%]">ดี/Good</td>
                <td class="border border-black p-1 w-[8%]">พอใช้/Fair</td>
                <td class="border border-black p-1 w-[8%]">ดีมาก/Exc.</td>
                <td class="border border-black p-1 w-[8%]">ดี/Good</td>
                <td class="border border-black p-1 w-[8%]">พอใช้/Fair</td>
              </tr>
              <!-- English -->
              <tr>
                <td class="border border-black text-left px-2 py-1">ภาษาอังกฤษ/English</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language === 'English')?.speaking === 'Excellent' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language === 'English')?.speaking === 'Good' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language === 'English')?.speaking === 'Fair' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language === 'English')?.reading === 'Excellent' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language === 'English')?.reading === 'Good' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language === 'English')?.reading === 'Fair' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language === 'English')?.writing === 'Excellent' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language === 'English')?.writing === 'Good' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language === 'English')?.writing === 'Fair' ? '✔' : '' }}</td>
              </tr>
              <!-- Other Languages -->
              <tr>
                <td class="border border-black text-left px-2 py-1 flex gap-2">อื่น ๆ /Other <span class="border-b border-dotted border-black flex-1 font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language !== 'English')?.language || '' }}</span></td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language !== 'English')?.speaking === 'Excellent' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language !== 'English')?.speaking === 'Good' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language !== 'English')?.speaking === 'Fair' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language !== 'English')?.reading === 'Excellent' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language !== 'English')?.reading === 'Good' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language !== 'English')?.reading === 'Fair' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language !== 'English')?.writing === 'Excellent' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language !== 'English')?.writing === 'Good' ? '✔' : '' }}</td>
                <td class="border border-black font-medium text-blue-800">{{ store.skillsAndOther.languages.find(l => l.language !== 'English')?.writing === 'Fair' ? '✔' : '' }}</td>
              </tr>
              <!-- Computer -->
              <tr>
                <td class="border border-black text-left px-2 py-1 border-b-0 align-top h-[20px]">ความสามารถในการใช้คอมพิวเตอร์<br><span class="text-[10px]">Computer Ability</span></td>
                <td colspan="9" class="border border-black text-left px-2 py-1 border-b-0 align-top">
                  <div class="flex gap-2 w-full">
                    <span>โปรแกรม<br><span class="text-[10px]">Program</span></span>
                    <span class="font-medium text-blue-800 flex-1">{{ store.skillsAndOther.computerAbility }}</span>
                  </div>
                </td>
              </tr>
              <!-- Other Qualifications -->
              <tr>
                <td colspan="10" class="border-t border-black text-left px-2 py-1 h-[20px] align-top bg-white">
                  <div class="flex gap-2">
                    <span>ความสามารถอื่น ๆ /Other Qualifications</span>
                    <span class="font-medium text-blue-800">{{ store.skillsAndOther.otherQualifications }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <!-- Vehicles Section -->
          <table class="w-full border-collapse border-[1.5px] border-black text-left mt-[-1.5px]">
            <tbody>
              <tr>
                <td class="border border-black p-1 w-[30%]">
                  <div class="flex justify-between items-center w-full">
                    <div>ขับรถยนต์<br><span class="text-[10px]">Drive Car</span></div>
                    <div class="flex flex-col gap-1 text-[10.5px]">
                      <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.drivingCar.canDrive === true"> ได้ Yes</label>
                      <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.drivingCar.canDrive === false"> ไม่ได้ No</label>
                    </div>
                  </div>
                </td>
                <td class="border border-black p-1 w-[25%]">
                  <div class="flex justify-between items-center w-full">
                    <div>มีรถยนต์ส่วนตัว<br><span class="text-[10px]">Own a car</span></div>
                    <div class="flex flex-col gap-1 text-[10.5px]">
                      <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.drivingCar.ownCar === true"> มี Yes</label>
                      <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.drivingCar.ownCar === false"> ไม่มี No</label>
                    </div>
                  </div>
                </td>
                <td class="border border-black p-1 w-[45%]">
                  <div class="flex justify-between items-center w-full">
                    <div>ใบอนุญาตขับขี่<br><span class="text-[10px]">Driving License</span></div>
                    <div class="flex flex-col gap-1 text-[10.5px] flex-1 pl-4">
                      <div class="flex items-center gap-2">
                        <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.drivingCar.hasLicense === true"> มี เลขที่</label>
                        <span class="border-b border-dotted border-black flex-1 font-medium text-blue-800">{{ store.skillsAndOther.drivingCar.hasLicense ? store.skillsAndOther.drivingCar.licenseNo : '' }}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-[10px] ml-4">Yes No.</span>
                        <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.drivingCar.hasLicense === false"> ไม่มี No</label>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              <!-- Motorcycle -->
              <tr>
                <td class="border border-black p-1 w-[30%]">
                  <div class="flex justify-between items-center w-full">
                    <div>ขับรถจักรยานยนต์<br><span class="text-[10px]">Ride Motorcycle</span></div>
                    <div class="flex flex-col gap-1 text-[10.5px]">
                      <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.drivingMotorcycle.canDrive === true"> ได้ Yes</label>
                      <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.drivingMotorcycle.canDrive === false"> ไม่ได้ No</label>
                    </div>
                  </div>
                </td>
                <td class="border border-black p-1 w-[25%]">
                  <div class="flex justify-between items-center w-full">
                    <div>มีรถจักรยานยนต์<br><span class="text-[10px]">Own a motorcycle</span></div>
                    <div class="flex flex-col gap-1 text-[10.5px]">
                      <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.drivingMotorcycle.ownMotorcycle === true"> มี Yes</label>
                      <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.drivingMotorcycle.ownMotorcycle === false"> ไม่มี No</label>
                    </div>
                  </div>
                </td>
                <td class="border border-black p-1 w-[45%]">
                  <div class="flex justify-between items-center w-full">
                    <div>ใบอนุญาตขับขี่<br><span class="text-[10px]">Driving License</span></div>
                    <div class="flex flex-col gap-1 text-[10.5px] flex-1 pl-4">
                      <div class="flex items-center gap-2">
                        <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.drivingMotorcycle.hasLicense === true"> มี เลขที่</label>
                        <span class="border-b border-dotted border-black flex-1 font-medium text-blue-800">{{ store.skillsAndOther.drivingMotorcycle.hasLicense ? store.skillsAndOther.drivingMotorcycle.licenseNo : '' }}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-[10px] ml-4">Yes No.</span>
                        <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.drivingMotorcycle.hasLicense === false"> ไม่มี No</label>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 7. General Data -->
        <div class="text-[11.5px]">
          <div class="font-bold text-[12.5px] mb-1">7. ข้อมูลทั่วไป GENERAL DATA</div>
          <div class="w-full border-[1.5px] border-black flex flex-col">
            <!-- Row 1 -->
            <div class="flex border-b border-black">
              <div class="w-[45%] border-r border-black p-1 flex flex-col gap-2">
                <div>1. การไปปฏิบัติงานต่างจังหวัด<br><span class="text-[10px]">Can you work up country?</span></div>
                <div class="flex justify-between items-center">
                  <span>เป็นการประจำ<br><span class="text-[10px]">Permanent</span></span>
                  <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.workUpCountry.permanent === false"> ขัดข้อง<br><span class="text-[10px]">No</span></label>
                  <label class="flex items-center gap-1 pr-4"><input type="checkbox" disabled :checked="store.skillsAndOther.workUpCountry.permanent === true"> ไม่ขัดข้อง<br><span class="text-[10px]">Yes</span></label>
                </div>
                <div class="flex justify-between items-center mt-2">
                  <span>เป็นครั้งคราว<br><span class="text-[10px]">Temporary</span></span>
                  <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.workUpCountry.temporary === false"> ขัดข้อง<br><span class="text-[10px]">No</span></label>
                  <label class="flex items-center gap-1 pr-4"><input type="checkbox" disabled :checked="store.skillsAndOther.workUpCountry.temporary === true"> ไม่ขัดข้อง<br><span class="text-[10px]">Yes</span></label>
                </div>
              </div>
              <div class="w-[55%] p-1 flex flex-col gap-2">
                <div>2. การเจ็บป่วยขนาดหนัก หรือโรคติดต่อร้ายแรง<br><span class="text-[10px]">Have you ever been seriously ill or contacted with contagious disease?</span></div>
                <div class="flex items-center gap-4 mt-2">
                  <label class="flex items-center gap-1 whitespace-nowrap"><input type="checkbox" disabled :checked="store.skillsAndOther.seriousIllness.hasHistory === false"> ไม่เคย / No</label>
                  <div class="flex flex-1 items-center gap-2">
                    <label class="flex items-center gap-1 whitespace-nowrap"><input type="checkbox" disabled :checked="store.skillsAndOther.seriousIllness.hasHistory === true"> เคย (ระบุ) / Yes (explain)</label>
                    <span class="border-b border-dotted border-black flex-1 font-medium text-blue-800">{{ store.skillsAndOther.seriousIllness.hasHistory ? store.skillsAndOther.seriousIllness.details : '' }}</span>
                  </div>
                </div>
                <div class="mt-4 flex gap-2 items-center">
                  <span>3. โรคประจำตัว.......................................<br><span class="text-[10px]">Any physical disability or handicap</span></span>
                  <span class="border-b border-dotted border-black flex-1 font-medium text-blue-800">{{ store.skillsAndOther.physicalDisability || '' }}</span>
                </div>
              </div>
            </div>
            
            <!-- Row 2 -->
            <div class="border-b border-black p-1 flex items-center justify-between">
              <div class="w-[45%]">
                <div>4. เคยถูกจำคุก หรือต้องโทษทางอาญาหรือไม่</div>
                <div class="text-[10px] mt-1">Have you ever been arrested, takes custody, help for investigation (reason/เหตุผล)</div>
                <div class="text-[10px] mt-1">Or questioning or charged by any law enforcement authority?</div>
              </div>
              <div class="w-[55%] pl-4 border-l border-transparent">
                <div class="flex items-start gap-10">
                  <label class="flex flex-col items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.arrestHistory.hasHistory === false"> ไม่เคย<span class="text-[10px]">No</span></label>
                  <div class="flex flex-col flex-1">
                    <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.arrestHistory.hasHistory === true"> เคย เพราะ<span class="text-[10px] ml-1">Yes</span></label>
                    <span class="border-b border-dotted border-black w-full mt-1.5 h-3 font-medium text-blue-800">{{ store.skillsAndOther.arrestHistory.hasHistory ? store.skillsAndOther.arrestHistory.reason : '' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Row 3 -->
            <div class="border-b border-black p-1 flex items-center justify-between">
              <div class="w-[45%]">
                <div>5. เคยถูกให้ออกจากงานหรือเลิกจ้างหรือไม่</div>
                <div class="text-[10px] mt-1">Have you ever been discharged from employment for any reason? (reason/เหตุผล)</div>
              </div>
              <div class="w-[55%] pl-4">
                <div class="flex items-start gap-10">
                  <label class="flex flex-col items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.dischargeHistory.hasHistory === false"> ไม่เคย<span class="text-[10px]">No</span></label>
                  <div class="flex flex-col flex-1">
                    <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.dischargeHistory.hasHistory === true"> เคย เพราะ<span class="text-[10px] ml-1">Yes</span></label>
                    <span class="border-b border-dotted border-black w-full mt-1.5 h-3 font-medium text-blue-800">{{ store.skillsAndOther.dischargeHistory.hasHistory ? store.skillsAndOther.dischargeHistory.reason : '' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Row 4 -->
            <div class="border-b border-black p-1 flex items-center justify-between">
              <div class="w-[45%]">
                <div>6. ท่านมีเพื่อนหรือญาติที่ทำงานที่บริษัทนี้หรือไม่</div>
                <div class="text-[10px] mt-1">Have you any friend or relative employed here? (Specify/ระบุ)</div>
              </div>
              <div class="w-[55%] pl-4">
                <div class="flex items-start gap-10">
                  <label class="flex flex-col items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.friendsInCompany.hasFriends === false"> ไม่มี<span class="text-[10px]">No</span></label>
                  <div class="flex flex-col flex-1">
                    <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.friendsInCompany.hasFriends === true"> มี (ระบุ)<span class="text-[10px] ml-1">Yes</span></label>
                    <span class="border-b border-dotted border-black w-full mt-1.5 h-3 font-medium text-blue-800">{{ store.skillsAndOther.friendsInCompany.hasFriends ? store.skillsAndOther.friendsInCompany.names : '' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Row 5 -->
            <div class="border-b border-black p-2">
              <div class="flex gap-2 items-center">
                <span>7. ท่านทราบข่าวการสมัครงานจาก</span>
                <label class="flex items-center gap-1"><input type="checkbox" disabled :checked="store.skillsAndOther.vacancySource?.includes('พนักงาน')"> พนักงาน ผู้สมัครเข้าฝึกงาน และผู้ฝึกงาน บริษัท ชื่อ</label>
                <span class="border-b border-dotted border-black flex-1 font-medium text-blue-800">{{ store.skillsAndOther.vacancySource?.includes('พนักงาน') ? store.skillsAndOther.referrerName : '' }}</span>
                <label class="flex items-center gap-1 ml-4"><input type="checkbox" disabled :checked="!store.skillsAndOther.vacancySource?.includes('พนักงาน') && !!store.skillsAndOther.vacancySource"> อื่น ๆ ระบุ</label>
                <span class="border-b border-dotted border-black w-[150px] font-medium text-blue-800">{{ !store.skillsAndOther.vacancySource?.includes('พนักงาน') && store.skillsAndOther.vacancySource ? store.skillsAndOther.vacancySource : '' }}</span>
              </div>
              <div class="flex justify-between w-[80%] mt-1 text-[10px]">
                <span>Where did you hear of our vacancy?</span>
                <span>Personal Recommendation.................................................................</span>
                <span>Others........................................</span>
              </div>
            </div>

            <!-- Row 6 -->
            <div class="p-2 flex gap-2 h-6 items-start">
              <span>8. ท่านมีหรือชอบงานอดิเรกอะไรบ้าง/What are your hobbies or interests?</span>
              <span class="font-medium text-blue-800 flex-1 ml-2">{{ store.skillsAndOther.hobbies }}</span>
            </div>
          </div>
        </div>

        <!-- 8. Further Information -->
        <div class="text-[11.5px]">
          <div class="font-bold text-[12.5px] mb-1">8. ข้อมูลเพิ่มเติม FURTHER INFORMATION</div>
          <div class="text-[11px] mb-1">ข้อมูลเพิ่มเติมซึ่งท่านคิดว่าจะเป็นประโยชน์ต่อการสมัครงาน/Further information which you considered to be beneficial to application.</div>
          <div class="border-b border-dotted border-black mt-1 w-full font-medium text-blue-800 h-5">{{ store.skillsAndOther.furtherInformation || '' }}</div>
          <div class="border-b border-dotted border-black mt-1 w-full h-5"></div>
        </div>

        <!-- 9. Personal Reference -->
        <div class="text-[11.5px]">
          <div class="font-bold text-[12.5px] mb-1">9. ผู้ให้การรับรอง PERSONAL REFERENCE</div>
          <div class="text-[11px] mb-1 text-gray-800">โปรดให้รายละเอียดของผู้ให้การรับรอง (ซึ่งไม่ใช่ญาติ) ที่รู้จักตัวท่านดี/Give information of references (other than relatives) who know you</div>
          <table class="w-full border-collapse border-[1.5px] border-black text-center mt-2">
            <thead class="bg-gray-50">
              <tr>
                <th class="border border-black px-2 py-1 w-[25%] font-normal">ชื่อ-นามสกุล/Name-<br><span class="text-[10px]">Surname</span></th>
                <th class="border border-black px-2 py-1 w-[30%] font-normal">ที่อยู่/สถานที่ทำงาน/Address/Office<br><span class="text-[10px]">Address</span></th>
                <th class="border border-black px-2 py-1 w-[15%] font-normal">ตำแหน่ง/Position</th>
                <th class="border border-black px-2 py-1 w-[15%] font-normal">โทรศัพท์/<br><span class="text-[10px]">Telephone</span></th>
                <th class="border border-black px-2 py-1 w-[15%] font-normal">ความสัมพันธ์/Relations</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-black px-2 py-1 text-left"><span class="mr-2">1.</span><span class="font-medium text-blue-800">{{ store.skillsAndOther.referencePersons[0]?.name || '' }}</span></td>
                <td class="border border-black px-2 py-1 font-medium text-blue-800">{{ store.skillsAndOther.referencePersons[0]?.address || '' }}</td>
                <td class="border border-black px-2 py-1 font-medium text-blue-800">{{ store.skillsAndOther.referencePersons[0]?.position || '' }}</td>
                <td class="border border-black px-2 py-1 font-medium text-blue-800">{{ store.skillsAndOther.referencePersons[0]?.phone || '' }}</td>
                <td class="border border-black px-2 py-1 font-medium text-blue-800">{{ store.skillsAndOther.referencePersons[0]?.relation || '' }}</td>
              </tr>
              <tr>
                <td class="border border-black px-2 py-1 text-left"><span class="mr-2">2.</span><span class="font-medium text-blue-800">{{ store.skillsAndOther.referencePersons[1]?.name || '' }}</span></td>
                <td class="border border-black px-2 py-1 font-medium text-blue-800">{{ store.skillsAndOther.referencePersons[1]?.address || '' }}</td>
                <td class="border border-black px-2 py-1 font-medium text-blue-800">{{ store.skillsAndOther.referencePersons[1]?.position || '' }}</td>
                <td class="border border-black px-2 py-1 font-medium text-blue-800">{{ store.skillsAndOther.referencePersons[1]?.phone || '' }}</td>
                <td class="border border-black px-2 py-1 font-medium text-blue-800">{{ store.skillsAndOther.referencePersons[1]?.relation || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Footer Page 3 -->
      <div class="flex justify-end text-[10.5px] mt-2">
        3/8
      </div>
    </div>


    <!-- PAGE 6: PDPA PART A (sections 1-3) -->
    <div class="page bg-white px-[1.5cm] pt-[1.5cm] pb-[2cm] w-[21cm] min-h-[29.5cm] mx-auto shadow-2xl mb-8 print:shadow-none print:mb-0 print:break-after-page text-[12px] leading-snug font-sans text-black relative flex flex-col justify-between">
      <div class="content flex-1">
        <div class="border-[1.5px] border-blue-800 text-blue-800 text-center font-bold p-1 mb-1 text-[11px]">
          “โปรดอ่านและยอมรับประกาศความเป็นส่วนตัวสำหรับ<br>
          ผู้สมัครเข้าเป็นพนักงาน ผู้สมัครเข้าฝึกงาน และผู้ฝึกงาน ผู้สมัครเข้าฝึกงาน และผู้ฝึกงาน<br>
          <u>บริษัท ยิปมั่นเทค จำกัด</u>”
        </div>
        <div class="text-center font-bold text-[11px] mb-1">
          ประกาศความเป็นส่วนตัว<br>
          <u>สำหรับผู้สมัครเข้าเป็นพนักงาน ผู้สมัครเข้าฝึกงาน และผู้ฝึกงาน</u>
        </div>

        <div class="pdpa-preview-content text-[9.5px]" v-html="cleanPdpaHtmlPartA"></div>
      </div>
      <div class="flex justify-end text-[10.5px] mt-1">
        4/8
      </div>
    </div>

    <!-- PAGE 7: PDPA PART B (sections 4-9) -->
    <div class="page bg-white px-[1.5cm] pt-[1.5cm] pb-[2cm] w-[21cm] min-h-[29.5cm] mx-auto shadow-2xl mb-8 print:shadow-none print:mb-0 print:break-after-page text-[12px] leading-snug font-sans text-black relative flex flex-col justify-between">
      <div class="content flex-1">
        <div class="pdpa-preview-content text-[9.5px]" v-html="cleanPdpaHtmlPartB"></div>
      </div>
      <div class="flex justify-end text-[10.5px] mt-6">
        5/8
      </div>
    </div>

    <!-- PAGE 8: PDPA PART C (sections 10-12) + SIGNATURE -->
    <div class="page bg-white px-[1.5cm] pt-[1.5cm] pb-[2cm] w-[21cm] min-h-[29.5cm] mx-auto shadow-2xl mb-8 print:shadow-none print:mb-0 print:break-after-page text-[12px] leading-snug font-sans text-black relative flex flex-col justify-between">
      <div class="content flex-1">
        <div class="pdpa-preview-content text-[9.5px]" v-html="cleanPdpaHtmlPartC"></div>

        <!-- Certification and Signature for PDPA -->
        <div class="mt-2 text-[10px] break-inside-avoid text-justify font-sans text-black">
          <p class="mb-2">ท่านสามารถใช้สิทธิตามกฎหมายได้ที่ฝ่ายทรัพยากรบุคคล <span class="bg-yellow-200">บริษัท ยิปมั่นเทค จำกัด</span></p>

          <div class="mb-2">
            <div class="font-bold">12. ข้อมูลเกี่ยวกับผู้ควบคุมข้อมูลส่วนบุคคลและเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล</div>
            <div class="ml-4">ผู้ควบคุมข้อมูลส่วนบุคคล : <span class="bg-yellow-200">บริษัท ยิปมั่นเทค จำกัด</span></div>
            <div class="ml-4">สถานที่ติดต่อ : <span class="bg-yellow-200">เลขที่ 9/9 อาคารแอทสาทร ชั้น 16 โซนเอ ถนนสาทรใต้ แขวงยานนาวา เขตสาทร กรุงเทพ 10120</span></div>
          </div>

          <p class="mb-3">กรณีที่ท่านมีข้อสอบถามเกี่ยวกับการคุ้มครองข้อมูลส่วนบุคคล โปรดติดต่อเบอร์ 02-335-5555 / 02-335-5777 หรือ e-mail: ....................</p>

          <div class="flex items-end gap-2 mb-1">
            <span class="whitespace-nowrap font-bold">ข้าพเจ้า</span>
            <span class="border-b border-dotted border-black flex-1 text-center text-blue-800 font-medium pb-1">{{ store.personalInfo.namePrefix || '' }} {{ store.personalInfo.firstName || '' }} {{ store.personalInfo.lastName || '' }}</span>
            <span class="whitespace-nowrap font-bold">ยอมรับประกาศความเป็นส่วนตัวสำหรับผู้สมัครเข้าเป็นพนักงาน ผู้สมัครเข้าฝึกงาน และผู้ฝึกงาน ผู้สมัครเข้าฝึกงาน และผู้ฝึกงาน</span>
          </div>
          <div class="mb-4 font-bold">บริษัท ยิปมั่นเทค จำกัด</div>

          <div class="flex justify-center mt-3">
            <div class="flex flex-col text-[10px] font-bold w-[70%]">
              <div class="flex items-end mb-2">
                <span class="mr-2">ลงชื่อ/Signature</span>
                <div class="relative flex-1 border-b border-dotted border-black flex justify-center h-6">
                  <img v-if="store.pdpaSignature" :src="store.pdpaSignature" class="max-h-12 absolute bottom-1" />
                </div>
                <span class="ml-2">ผู้สมัคร/Applicant</span>
              </div>
              <div class="flex items-end justify-center pr-20 mt-2">
                <span class="mr-2">วันที่/Date</span>
                <div class="w-48 border-b border-dotted border-black text-center font-normal text-blue-800 pb-1">{{ store.pdpaConsentDate ? formatDate(store.pdpaConsentDate) : '' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end text-[10.5px] mt-6">
        6/8
      </div>
    </div>

    <!-- PAGE 9: CONSENT FORM PART A (sections 1-2) -->
    <div class="page bg-white px-[1.5cm] pt-[1.5cm] pb-[2cm] w-[21cm] min-h-[29.5cm] mx-auto shadow-2xl mb-8 print:shadow-none print:mb-0 print:break-after-page text-[12px] leading-snug font-sans text-black relative flex flex-col justify-between">
      <div class="content flex-1">
        <div class="text-center font-bold text-[12.5px] mb-2">
          หนังสือให้ความยินยอมเก็บรวบรวม ใช้ และ/หรือเปิดเผยข้อมูลส่วนบุคคล
        </div>
        <div class="text-[11px] flex flex-wrap gap-2 mb-2 leading-snug">
          <span class="mr-2">ข้าพเจ้า</span>
          <span class="border-b border-dotted border-black flex-1 text-center font-medium text-blue-800">{{ store.personalInfo.namePrefix || '' }} {{ store.personalInfo.firstName || '' }} {{ store.personalInfo.lastName || '' }}</span>
          <span>ซึ่งเป็นผู้สมัครเข้าเป็นพนักงาน ผู้สมัครเข้าฝึกงาน / ผู้ฝึกงาน ของ <span class="bg-yellow-200 font-bold px-1">บริษัท ยิปมั่นเทค จำกัด</span></span>
        </div>
        <div class="text-[11px] indent-8 mb-2 leading-snug">
          ให้บริษัทเก็บรวบรวม ใช้ หรือเปิดเผยข้อมูลส่วนบุคคลของข้าพเจ้าที่มีอยู่ กับ <span class="bg-yellow-200 font-bold px-1">บริษัท ยิปมั่นเทค จำกัด</span> ดังที่ปรากฏตามประกาศความเป็นส่วนตัวสำหรับผู้สมัครเข้าเป็นพนักงาน ผู้สมัครเข้าฝึกงาน และผู้ฝึกงาน ของ <span class="bg-yellow-200 font-bold px-1">บริษัท ยิปมั่นเทค จำกัด</span> และ ข้อกำหนด และเงื่อนไข ดังต่อไปนี้
        </div>

        <div class="font-bold text-[11px] mb-1">ข้อกำหนดและเงื่อนไข</div>

        <div class="pdpa-preview-content text-[9.5px]" v-html="cleanConsentHtmlPartA"></div>
      </div>
      <div class="flex justify-end text-[10.5px] mt-6">
        7/8
      </div>
    </div>

    <!-- PAGE 10: CONSENT FORM PART B (section 3) + SIGNATURE -->
    <div class="page bg-white px-[1.5cm] pt-[1.5cm] pb-[2cm] w-[21cm] min-h-[29.5cm] mx-auto shadow-2xl mb-8 print:shadow-none print:mb-0 print:break-after-page text-[12px] leading-snug font-sans text-black relative flex flex-col justify-between">
      <div class="content flex-1">
        <div class="pdpa-preview-content text-[9.5px]" v-html="cleanConsentHtmlPartB"></div>

        <!-- Signature block for Consent -->
        <div class="flex justify-center mt-8 mb-4">
          <div class="flex flex-col text-[10.5px] font-bold w-[60%] items-center">
            <div class="flex items-end mb-3 w-full">
              <span class="mr-2">ลงชื่อ</span>
              <div class="relative flex-1 border-b border-dotted border-black flex justify-center h-6">
                <img v-if="store.pdpaSignature" :src="store.pdpaSignature" class="max-h-12 absolute bottom-1" />
              </div>
              <span class="ml-2">เจ้าของข้อมูลส่วนบุคคล</span>
            </div>
            <div class="flex items-end justify-center w-full mt-2">
              <span class="mr-2">วันที่</span>
              <div class="w-48 border-b border-dotted border-black text-center font-normal text-blue-800 pb-1">{{ store.pdpaConsentDate ? formatDate(store.pdpaConsentDate) : '' }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-end text-[10.5px] mt-6">
        8/8
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Scoped styles to format the imported PDPA html as a plain document */
:deep(.pdpa-preview-content) {
  font-family: 'Sarabun', 'SarabunIT', sans-serif;
  line-height: 1.25;
  text-align: justify;
}
:deep(.pdpa-preview-content h3) {
  font-size: 10px;
  font-weight: bold;
  margin-top: 6px;
  margin-bottom: 2px;
}
:deep(.pdpa-preview-content p), :deep(.pdpa-preview-content div) {
  margin-bottom: 3px;
}
:deep(.pdpa-preview-content > p), :deep(.pdpa-preview-content > div) {
  text-indent: 20px;
}
:deep(.pdpa-preview-content ul) {
  margin-bottom: 3px;
  padding-left: 20px;
}
:deep(.pdpa-preview-content li) {
  margin-bottom: 2px;
  display: flex;
}

@media print {
  @page {
    size: A4;
    margin: 0; /* No browser margin, rely on .page padding */
  }
  .page {
    margin: 0 !important;
    box-shadow: none !important;
    page-break-after: always;
    break-after: page;
    /* Flexbox print fragmentation is unreliable in Chrome (can force spurious
       page breaks even when content fits). Footers flow normally now,
       so the flex layout is only needed on screen. */
    display: block !important;
    /* A .page whose own box is already ~1 physical page tall triggers a
       Chrome bug where page-break-after:always inserts an extra blank page
       (the box "naturally" fills a page, then the forced break adds another).
       Print doesn't need min-height to reserve a full sheet — page-break-after
       already starts every .page on its own physical page regardless of its
       content height — so drop the floor entirely for print. */
    min-height: 0 !important;
  }
  /* Never break after the last page, or print emits a trailing blank sheet */
  .page:last-child {
    page-break-after: avoid;
    break-after: avoid;
  }
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  /* Prevent elements from being cut in half across pages */
  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .pdpa-preview-content p, .pdpa-preview-content li, .pdpa-preview-content > div {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .pdpa-preview-content h3 {
    page-break-after: avoid;
    break-after: avoid;
  }
}
</style>
