<script setup lang="ts">
interface DbCheckResult {
  ok: boolean
  stage: 'config' | 'connect' | 'connected'
  message: string
  target: {
    connection: string
    host: string | null
    port: string | null
    database: string | null
    username: string | null
  }
  elapsedMs?: number
}

const result = ref<DbCheckResult | null>(null)
const isChecking = ref(false)
const lastCheckedAt = ref<Date | null>(null)

const runCheck = async () => {
  isChecking.value = true
  try {
    result.value = await $fetch<DbCheckResult>('/api/health/db')
  } catch (err: any) {
    result.value = err?.data || {
      ok: false,
      stage: 'connect',
      message: err?.message || 'ไม่สามารถเรียก API ตรวจสอบฐานข้อมูลได้',
      target: { connection: '', host: null, port: null, database: null, username: null }
    }
  } finally {
    lastCheckedAt.value = new Date()
    isChecking.value = false
  }
}

onMounted(runCheck)
</script>

<template>
  <div class="flex flex-col items-center px-4 py-8">
    <div class="w-full max-w-xl">
      <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-100 overflow-hidden">
        <div
          class="h-2"
          :class="result?.ok ? 'bg-green-500' : result === null ? 'bg-slate-200' : 'bg-red-500'"
        ></div>

        <div class="p-8 sm:p-10">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-slate-900">ตรวจสอบการเชื่อมต่อฐานข้อมูล</h2>
            <p class="text-sm text-slate-500 mt-1.5">ใช้หน้านี้เพื่อวินิจฉัยปัญหาก่อนเข้าสู่ระบบไม่ได้</p>
          </div>

          <!-- Status -->
          <div
            class="rounded-xl border px-4 py-4 flex items-start gap-3 mb-6"
            :class="result?.ok
              ? 'bg-green-50 border-green-100 text-green-700'
              : result === null
                ? 'bg-slate-50 border-slate-100 text-slate-500'
                : 'bg-red-50 border-red-100 text-red-600'"
          >
            <svg v-if="isChecking" class="w-5 h-5 flex-shrink-0 animate-spin mt-0.5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <svg v-else-if="result?.ok" class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <svg v-else class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div class="text-sm font-medium leading-relaxed">
              <span v-if="isChecking">กำลังตรวจสอบ...</span>
              <span v-else-if="result">{{ result.message }}</span>
              <span v-else>ยังไม่ได้ตรวจสอบ</span>
              <div v-if="result?.elapsedMs !== undefined" class="text-xs font-normal opacity-75 mt-0.5">
                ใช้เวลา {{ result.elapsedMs }} ms
              </div>
            </div>
          </div>

          <!-- Connection target -->
          <div v-if="result?.target" class="mb-6">
            <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">ปลายทางที่พยายามเชื่อมต่อ</h3>
            <dl class="text-sm bg-slate-50 border border-slate-100 rounded-xl divide-y divide-slate-100">
              <div class="flex justify-between px-4 py-2.5">
                <dt class="text-slate-500">Connection</dt>
                <dd class="font-mono text-slate-800">{{ result.target.connection || '—' }}</dd>
              </div>
              <div class="flex justify-between px-4 py-2.5">
                <dt class="text-slate-500">Host</dt>
                <dd class="font-mono text-slate-800">{{ result.target.host || '(ยังไม่ได้ตั้งค่า)' }}</dd>
              </div>
              <div class="flex justify-between px-4 py-2.5">
                <dt class="text-slate-500">Port</dt>
                <dd class="font-mono text-slate-800">{{ result.target.port || '(ยังไม่ได้ตั้งค่า)' }}</dd>
              </div>
              <div class="flex justify-between px-4 py-2.5">
                <dt class="text-slate-500">Database</dt>
                <dd class="font-mono text-slate-800">{{ result.target.database || '(ยังไม่ได้ตั้งค่า)' }}</dd>
              </div>
              <div class="flex justify-between px-4 py-2.5">
                <dt class="text-slate-500">Username</dt>
                <dd class="font-mono text-slate-800">{{ result.target.username || '(ยังไม่ได้ตั้งค่า)' }}</dd>
              </div>
            </dl>
          </div>

          <button
            :disabled="isChecking"
            class="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-50"
            @click="runCheck"
          >
            <svg class="w-4 h-4" :class="{ 'animate-spin': isChecking }" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            ตรวจสอบอีกครั้ง
          </button>

          <p v-if="lastCheckedAt" class="text-xs text-slate-400 text-center mt-3">
            ตรวจสอบล่าสุดเมื่อ {{ lastCheckedAt.toLocaleTimeString('th-TH') }}
          </p>

          <div class="mt-6 text-xs text-slate-400 leading-relaxed border-t border-slate-100 pt-4">
            <p>หากเพิ่งแก้ไขไฟล์ <code class="bg-slate-100 px-1 py-0.5 rounded">.env</code> บนเครื่อง server ต้อง<strong>รีสตาร์ทแอปใหม่</strong> ค่าที่แก้จะยังไม่ถูกใช้จนกว่าจะรีสตาร์ท process</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
