<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()

const startOnboarding = () => {
  router.push('/onboarding/pdpa')
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
    <div class="mb-6">
      <img src="/Logo_GM_Large.png" alt="GMT Logo" class="h-32 md:h-40 object-contain mx-auto drop-shadow-xl" />
    </div>
    <h1 class="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
      <span class="text-slate-700">HR Management</span>
      </br>
    </h1>
    <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
      <button @click="startOnboarding" class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-1 w-full sm:w-auto">
        กรอกข้อมูลสมัครงาน
      </button>

      <NuxtLink to="/login" class="px-8 py-4 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 font-semibold rounded-xl shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
        เข้าสู่ระบบ Admin
      </NuxtLink>
    </div>
  </div>
</template>
