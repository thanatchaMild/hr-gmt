<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <!-- แถบนำทางสำหรับพนักงานใหม่ -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
      <div class="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-blue-600"></div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src="/Logo_GM_small.png" alt="GMT Logo" class="h-10 object-contain" />
          <span class="text-xl font-bold text-slate-800 tracking-tight">HR Management</span>
        </NuxtLink>
        <div class="flex items-center gap-4 text-sm font-medium">
          <NuxtLink to="/" class="text-slate-600 hover:text-blue-600 flex items-center gap-1 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            กลับหน้าหลัก
          </NuxtLink>
          <span class="text-slate-300">|</span>
          <span class="text-slate-500">
            ต้องการความช่วยเหลือ? <a href="#" class="text-blue-600 hover:underline">ติดต่อฝ่ายสนับสนุน</a>
          </span>
        </div>
      </div>
    </header>

    <main class="flex-1 w-full max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 print:p-0 print:max-w-none print:m-0">
      <slot />
    </main>

    <footer class="bg-white border-t border-slate-200 py-6 print:hidden">
      <div class="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
        &copy; {{ new Date().getFullYear() }} GMT HR Management System. สงวนลิขสิทธิ์ทุกประการ
      </div>
    </footer>
  </div>
</template>

