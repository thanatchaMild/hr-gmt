<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppButton from '~/components/onboarding/ui/AppButton.vue'

const route = useRoute()

const reasonMessages: Record<string, string> = {
  MISSING: 'ไม่พบลิงก์สำหรับกรอกใบสมัคร กรุณาใช้ลิงก์ที่ได้รับจากฝ่าย HR',
  NOT_FOUND: 'ลิงก์นี้ไม่ถูกต้อง กรุณาตรวจสอบลิงก์ที่ได้รับจากฝ่าย HR อีกครั้ง',
  EXPIRED: 'ลิงก์นี้หมดอายุแล้ว (ลิงก์มีอายุใช้งาน 3 วัน) กรุณาติดต่อฝ่าย HR เพื่อขอลิงก์ใหม่',
  ALREADY_SUBMITTED: 'ลิงก์นี้ถูกใช้ส่งใบสมัครไปแล้ว หากต้องการแก้ไขข้อมูล กรุณาติดต่อฝ่าย HR',
  REVOKED: 'ลิงก์นี้ถูกยกเลิกแล้ว กรุณาติดต่อฝ่าย HR เพื่อขอลิงก์ใหม่'
}

const reason = computed(() => (route.query.reason as string) || 'NOT_FOUND')
const message = computed(() => reasonMessages[reason.value] || reasonMessages.NOT_FOUND)
</script>

<template>
  <div class="max-w-lg mx-auto py-12">
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
      <div class="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-amber-100">
        <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>
      <h1 class="text-xl font-bold text-slate-800 mb-2">ลิงก์นี้ไม่พร้อมใช้งาน</h1>
      <p class="text-slate-500 text-sm leading-relaxed mb-8">{{ message }}</p>
      <AppButton variant="outline" @click="$router.push('/')">กลับสู่หน้าหลัก</AppButton>
    </div>
  </div>
</template>
