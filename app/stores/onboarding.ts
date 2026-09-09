import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { deriveEmployeeType, type HireType } from '~/utils/hireType'

export const useOnboardingStore = defineStore('onboarding', () => {
  // 1. Employment type (สถานะการจ้าง) & access. employeeType is derived for legacy consumers.
  const hireType = ref<HireType | null>(null)
  const employeeType = computed(() => (hireType.value ? deriveEmployeeType(hireType.value) : null))
  const token = ref<string | null>(null)
  const employeeCode = ref<string | null>(null)

  // 2. PDPA Consent
  const pdpaConsent = ref(false)
  const pdpaConsentDate = ref<string | null>(null)
  const pdpaSignature = ref<string | null>(null)

  // 3. Personal Info (From Form.pdf section 1)
  const personalInfo = ref({
    positionApplied: '', // ตำแหน่งที่ต้องการสมัคร
    availableStartDate: '', // วันที่พร้อมจะเริ่มงานได้
    prefix: '', // นาย/นาง/นางสาว
    firstName: '',
    lastName: '',
    prefixEn: '', // Mr./Mrs./Miss
    firstNameEn: '',
    lastNameEn: '',
    gender: '',
    birthDate: '',
    age: null as number | null,
    weight: null as number | null,
    height: null as number | null,
    idCardNumber: '',
    idCardIssueDate: '',
    idCardExpiryDate: '',
    nationality: 'Thai',
    religion: 'Buddhism',
    placeOfBirth: '',
    militaryStatus: '', // Exempted, Non Exempted, Territorial Degree Student, Date Entered Service
    militaryServiceDate: ''
  })

  // 4. Contact Info
  const contactInfo = ref({
    presentAddress: '',
    permanentAddress: '', // ที่อยู่ตามทะเบียนบ้าน
    email: '',
    homePhone: '',
    mobilePhone: '',
    socialMedia: {
      line: '',
      facebook: ''
    }
  })

  // 5. Family Info (From Form.pdf section 2)
  const familyInfo = ref({
    maritalStatus: 'SINGLE', // SINGLE, MARRIED, SEPARATED, DIVORCED, WIDOWED
    father: { name: '', age: null as number|null, occupation: '', address: '', phone: '' },
    mother: { name: '', age: null as number|null, occupation: '', address: '', phone: '' },
    spouse: { name: '', age: null as number|null, occupation: '', address: '', phone: '' },
    siblingsTotal: null as number | null,
    birthOrder: null as number | null, // ท่านเป็นคนที่...
    siblings: [] as Array<{ name: string, age: null | number, occupation: string, address: string, phone: string }>,
    childrenTotal: null as number | null,
    children: [] as Array<{ name: string, age: null | number, occupation: string, address: string, phone: string }>
  })

  // 6. Education & Training (From Form.pdf section 3 & 4)
  const educationHistory = ref({
    continuingStudies: false,
    continuingDetails: '',
    records: [] as Array<{
      level: string, // มัธยมศึกษาตอนต้น, ตอนปลาย/ปวช, อนุปริญญา/ปวส, ปริญญาตรี, ปริญญาโท, อื่นๆ
      institution: string,
      degree: string,
      major: string,
      graduatedYear: string,
      gpa: string
    }>
  })

  const trainingHistory = ref<Array<{
    course: string,
    institution: string,
    certificate: string,
    period: string,
    year: string
  }>>([])

  // 7. Work History (From Form.pdf section 5)
  const workHistory = ref<Array<{
    company: string,
    businessType: string,
    address: string,
    phone: string,
    responsibility: string,
    startDate: string,
    endDate: string,
    firstPosition: string,
    lastPosition: string,
    startingSalary: string,
    lastSalary: string,
    otherIncome: string,
    reasonForLeaving: string
  }>>([])

  // 8. Special Abilities & General Data (From Form.pdf section 6 & 7 & 8)
  const skillsAndOther = ref({
    languages: [{ language: 'ภาษาอังกฤษ (English)', speaking: '', reading: '', writing: '' }] as Array<{ language: string, speaking: string, reading: string, writing: string }>, // Exc, Good, Fair
    computerAbility: '',
    otherQualifications: '',
    drivingCar: { canDrive: false, ownCar: false, hasLicense: false, licenseNo: '' },
    drivingMotorcycle: { canDrive: false, ownMotorcycle: false, hasLicense: false, licenseNo: '' },
    
    // General Data
    workUpCountry: { permanent: null as boolean|null, temporary: null as boolean|null }, // Permanent, Temporary Yes/No
    seriousIllness: { hasHistory: false, details: '' },
    physicalDisability: '',
    arrestHistory: { hasHistory: false, reason: '' },
    dischargeHistory: { hasHistory: false, reason: '' },
    friendsInCompany: { hasFriends: false, names: '' },
    vacancySource: '', // Source of application
    referrerName: '', // Referrer's Name
    hobbies: '',
    furtherInformation: '', // section 8

    referencePersons: [
      { name: '', address: '', position: '', phone: '', relation: '' },
      { name: '', address: '', position: '', phone: '', relation: '' }
    ] as Array<{ name: string, address: string, position: string, phone: string, relation: string }>, // section 9
    emergencyContacts: [{ name: '', relation: '', address: '', phone: '' }] as Array<{ name: string, relation: string, address: string, phone: string }>,
    
    bankAccount: {
      bankName: '',
      branch: '',
      accountNumber: ''
    }
  })

  // 9. Sensitive Info
  const sensitiveInfo = ref({
    health: {
      underlyingDiseases: '',
      colorBlind: false,
      allergies: '',
      bloodType: ''
    },
    criminalRecord: ''
  })

  // 10. Documents
  const documents = ref({
    idCard: null as File | string | null,
    houseRegistration: null as File | string | null,
    degreeCertificate: null as File | string | null,
    transcript: null as File | string | null,
    bankBook: null as File | string | null,
    photo: null as File | string | null, // Added from PDF top corner
    militaryDocument: null as File | string | null, // For male applicants
    other: [] as Array<File | string>
  })

  // 11. IT Request
  const itRequest = ref({
    equipment: [] as string[],
    softwareAccounts: [] as string[]
  })

  // Actions
  function setToken(newToken: string) {
    token.value = newToken
  }

  function setEmployeeCode(code: string) {
    employeeCode.value = code
  }

  // Populates the store from an already-submitted employee record, for HR editing.
  function loadFromEmployee(employee: any) {
    const data = employee.formData || {}
    hireType.value = employee.hireType ?? employee.employeeType
    if (data.personalInfo) Object.assign(personalInfo.value, data.personalInfo)
    if (data.contactInfo) Object.assign(contactInfo.value, data.contactInfo)
    if (data.familyInfo) Object.assign(familyInfo.value, data.familyInfo)
    if (data.educationHistory) Object.assign(educationHistory.value, data.educationHistory)
    if (data.trainingHistory) trainingHistory.value = data.trainingHistory
    if (data.workHistory) workHistory.value = data.workHistory
    if (data.skillsAndOther) Object.assign(skillsAndOther.value, data.skillsAndOther)
    if (data.sensitiveInfo) Object.assign(sensitiveInfo.value, data.sensitiveInfo)

    documents.value = {
      idCard: null, houseRegistration: null, degreeCertificate: null, transcript: null,
      bankBook: null, photo: null, militaryDocument: null, other: []
    }
    for (const doc of employee.documents || []) {
      if (doc.documentType in documents.value) {
        (documents.value as any)[doc.documentType] = doc.fileUrl
      }
    }
  }

  function agreePdpa(signature: string) {
    pdpaConsent.value = true
    pdpaSignature.value = signature
    pdpaConsentDate.value = new Date().toISOString()
  }

  function resetForm() {
    hireType.value = null
    pdpaConsent.value = false
    pdpaConsentDate.value = null
    pdpaSignature.value = null
  }

  async function uploadIfFile(value: File | string | null): Promise<string | null> {
    if (!value) return null
    if (typeof value === 'string') return value

    const formData = new FormData()
    formData.append('file', value)
    const { url } = await $fetch<{ url: string }>('/api/uploads', {
      method: 'POST',
      body: formData
    })
    return url
  }

  async function submitForm() {
    const uploadedDocuments: Record<string, string | null> = {
      idCard: await uploadIfFile(documents.value.idCard),
      houseRegistration: await uploadIfFile(documents.value.houseRegistration),
      degreeCertificate: await uploadIfFile(documents.value.degreeCertificate),
      transcript: await uploadIfFile(documents.value.transcript),
      bankBook: await uploadIfFile(documents.value.bankBook),
      photo: await uploadIfFile(documents.value.photo),
      militaryDocument: await uploadIfFile(documents.value.militaryDocument)
    }

    await $fetch('/api/employees', {
      method: 'POST',
      body: {
        token: token.value,
        employeeCode: employeeCode.value,
        hireType: hireType.value,
        pdpaConsent: pdpaConsent.value,
        pdpaConsentDate: pdpaConsentDate.value,
        personalInfo: personalInfo.value,
        contactInfo: contactInfo.value,
        familyInfo: familyInfo.value,
        educationHistory: educationHistory.value,
        trainingHistory: trainingHistory.value,
        workHistory: workHistory.value,
        skillsAndOther: skillsAndOther.value,
        sensitiveInfo: sensitiveInfo.value,
        itRequest: itRequest.value,
        documents: uploadedDocuments
      }
    })

    return true
  }

  return {
    hireType,
    employeeType,
    token,
    employeeCode,
    pdpaConsent,
    pdpaConsentDate,
    pdpaSignature,
    personalInfo,
    contactInfo,
    familyInfo,
    educationHistory,
    trainingHistory,
    workHistory,
    skillsAndOther,
    sensitiveInfo,
    documents,
    itRequest,
    setToken,
    setEmployeeCode,
    loadFromEmployee,
    agreePdpa,
    resetForm,
    submitForm
  }
})
