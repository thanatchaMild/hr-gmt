<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'vue-router'
import NotificationBell from '~/components/admin/NotificationBell.vue'

const authStore = useAuthStore()
const router = useRouter()

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col md:flex-row">
    <!-- Sidebar -->
    <aside class="w-full md:w-64 bg-white border-r border-slate-200/80 text-slate-700 flex-shrink-0 flex flex-col print:hidden">
      <div class="h-20 flex items-center justify-center px-6 bg-white border-b border-slate-200/80">
        <img src="/Logo_GM_small.png" alt="GMT Logo" class="h-12 w-auto object-contain">
      </div>
      <nav class="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <NuxtLink to="/admin" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors font-medium text-sm" exact-active-class="!bg-gradient-to-r !from-blue-50 !to-blue-50/40 !text-blue-700 font-semibold shadow-sm ring-1 ring-blue-100">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          แดชบอร์ด
        </NuxtLink>

        <!-- HR Admin Menus -->
        <div v-if="authStore.isHRAdmin" class="pt-5 pb-2 px-3 text-[11px] font-bold uppercase text-slate-400 tracking-widest">ระบบบุคคล (HR)</div>
        <NuxtLink v-if="authStore.isHRAdmin" to="/admin/hr/applications" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors" active-class="!bg-gradient-to-r !from-blue-50 !to-blue-50/40 !text-blue-700 font-semibold shadow-sm ring-1 ring-blue-100">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <div class="flex flex-col leading-tight">
            <span class="text-sm font-medium">ใบสมัครใหม่</span>
            <span class="text-[10px] opacity-60 uppercase tracking-widest mt-0.5">Onboarding</span>
          </div>
        </NuxtLink>
        <NuxtLink v-if="authStore.isHRAdmin" to="/admin/hr/employees" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors" active-class="!bg-gradient-to-r !from-blue-50 !to-blue-50/40 !text-blue-700 font-semibold shadow-sm ring-1 ring-blue-100">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          <div class="flex flex-col leading-tight">
            <span class="text-sm font-medium">ข้อมูลพนักงานทั้งหมด</span>
            <span class="text-[10px] opacity-60 uppercase tracking-widest mt-0.5">Employees</span>
          </div>
        </NuxtLink>
        <NuxtLink v-if="authStore.isHRAdmin" to="/admin/hr/it-requests" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors" active-class="!bg-gradient-to-r !from-blue-50 !to-blue-50/40 !text-blue-700 font-semibold shadow-sm ring-1 ring-blue-100">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          <div class="flex flex-col leading-tight">
            <span class="text-sm font-medium">คำขออุปกรณ์ IT</span>
            <span class="text-[10px] opacity-60 uppercase tracking-widest mt-0.5">IT Requests</span>
          </div>
        </NuxtLink>

        <!-- IT Admin Menus -->
        <div v-if="authStore.isITAdmin" class="pt-5 pb-2 px-3 text-[11px] font-bold uppercase text-slate-400 tracking-widest">ระบบอุปกรณ์ (IT)</div>
        <NuxtLink v-if="authStore.isITAdmin" to="/admin/it/requests" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-purple-600 transition-colors" active-class="!bg-gradient-to-r !from-purple-50 !to-purple-50/40 !text-purple-700 font-semibold shadow-sm ring-1 ring-purple-100">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <div class="flex flex-col leading-tight">
            <span class="text-sm font-medium">จัดการคำขอ</span>
            <span class="text-[10px] opacity-60 uppercase tracking-widest mt-0.5">IT Requests</span>
          </div>
        </NuxtLink>
        <NuxtLink v-if="authStore.isITAdmin" to="/admin/it/assets" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-purple-600 transition-colors" active-class="!bg-gradient-to-r !from-purple-50 !to-purple-50/40 !text-purple-700 font-semibold shadow-sm ring-1 ring-purple-100">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          <div class="flex flex-col leading-tight">
            <span class="text-sm font-medium">รายการทรัพย์สิน</span>
            <span class="text-[10px] opacity-60 uppercase tracking-widest mt-0.5">Assets</span>
          </div>
        </NuxtLink>
        <NuxtLink v-if="authStore.isITAdmin" to="/admin/it/categories" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-purple-600 transition-colors" active-class="!bg-gradient-to-r !from-purple-50 !to-purple-50/40 !text-purple-700 font-semibold shadow-sm ring-1 ring-purple-100">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
          <div class="flex flex-col leading-tight">
            <span class="text-sm font-medium">หมวดหมู่อุปกรณ์</span>
            <span class="text-[10px] opacity-60 uppercase tracking-widest mt-0.5">Categories</span>
          </div>
        </NuxtLink>
      </nav>

      <div class="p-4 border-t border-slate-100">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" @click="logout" title="คลิกเพื่อออกจากระบบ">
          <div class="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.5.88 4.93 1.78A7.893 7.893 0 0112 19.5c-1.9 0-3.65-.67-5.07-1.72zm11.1-1.32c-1.22-1.42-4.11-2.46-6.17-2.46s-4.95 1.04-6.17 2.46A7.95 7.95 0 014.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5c0 1.96-.75 3.75-1.93 5.06zM12 6.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM9.5 10a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z" clip-rule="evenodd"></path></svg>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800 truncate">{{ authStore.user?.name || 'User' }}</p>
            <p class="text-xs text-slate-400">ออกจากระบบ</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden">
      <!-- Topbar Header -->
      <header class="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/70 flex items-center justify-between px-6 flex-shrink-0 print:hidden sticky top-0 z-10">
        <h1 class="text-lg font-bold text-slate-800 tracking-tight capitalize">{{ $route.name?.toString().replace(/-/g, ' ') || 'Dashboard' }}</h1>
        <div class="flex items-center gap-3">
          <NuxtLink to="/" class="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors bg-slate-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span class="hidden sm:inline">กลับหน้าหลัก</span>
          </NuxtLink>
          <div class="w-px h-6 bg-slate-200"></div>
          <NotificationBell />
        </div>
      </header>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-auto p-6 print:p-0 print:bg-white print:overflow-visible">
        <slot />
      </div>
    </main>
  </div>
</template>
