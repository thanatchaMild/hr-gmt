<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { pdpaHtml } from '~/utils/pdpaContent'
import AppButton from '~/components/onboarding/ui/AppButton.vue'
import StyledCheckbox from '~/components/onboarding/ui/StyledCheckbox.vue'

const router = useRouter()
const isAccepted = ref(false)
const hasScrolledToBottom = ref(false)
const contentRef = ref<HTMLElement | null>(null)

function handleScroll(e: Event) {
  const target = e.target as HTMLElement
  // Tolerance of 10px to account for fractional pixel calculations
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
    hasScrolledToBottom.value = true
  }
}

onMounted(() => {
  // If content is short and doesn't need scrolling, unlock immediately
  setTimeout(() => {
    if (contentRef.value) {
      if (contentRef.value.scrollHeight <= contentRef.value.clientHeight) {
        hasScrolledToBottom.value = true
      }
    }
  }, 100)
})

function proceed() {
  if (!isAccepted.value) {
    alert('กรุณากดยอมรับการรับทราบประกาศความเป็นส่วนตัวก่อนดำเนินการต่อ')
    return
  }

  router.push('/onboarding/consent')
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Main Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-4">
      <!-- Content (Scrollable) -->
      <div
        ref="contentRef"
        @scroll="handleScroll"
        class="p-6 md:p-8 max-h-[55vh] overflow-y-auto styled-scrollbar relative"
      >
        <div class="mb-6 text-center flex flex-col items-center">
          <img src="/Logo_GM_Large.png" alt="GMT Logo" class="h-10 md:h-12 mb-2 object-contain">
          <h1 class="text-xl md:text-2xl font-bold text-slate-800">ประกาศความเป็นส่วนตัว</h1>
          <p class="text-xs md:text-sm text-slate-500 font-medium">บริษัท ยิปมั่นเทค จำกัด (Privacy Notice)</p>
        </div>

        <div class="pdpa-content" v-html="pdpaHtml"></div>
      </div>

      <!-- Action Area -->
      <div class="p-4 md:p-6 border-t border-slate-200 transition-colors duration-500" :class="hasScrolledToBottom ? 'bg-slate-50' : 'bg-slate-100'">
        <div v-if="!hasScrolledToBottom" class="text-center text-sm font-medium text-amber-600 mb-3 bg-amber-50 py-2 px-4 rounded-lg border border-amber-100 w-full">
          ↓ กรุณาเลื่อนอ่านประกาศให้ครบถ้วนก่อนกดยอมรับ
        </div>

        <label
          class="flex items-start gap-3 p-3 md:p-4 rounded-xl bg-white border shadow-sm transition-colors"
          :class="hasScrolledToBottom ? 'cursor-pointer border-slate-200 hover:border-primary-300' : 'opacity-60 cursor-not-allowed border-slate-200 bg-slate-100'"
        >
          <StyledCheckbox v-model="isAccepted" :disabled="!hasScrolledToBottom" class="mt-0.5" />
          <span class="text-slate-700 font-medium text-sm md:text-base leading-relaxed">
            ข้าพเจ้าได้อ่านและทำความเข้าใจรายละเอียดในประกาศความเป็นส่วนตัวนี้เป็นที่เรียบร้อยแล้ว
          </span>
        </label>

        <div class="mt-4 md:mt-6 flex justify-end">
          <AppButton size="lg" block class="md:w-auto" :disabled="!isAccepted" @click="proceed">
            ถัดไป
            <template #icon-right>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </template>
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.pdpa-content) {
  @apply text-slate-700 text-sm md:text-base leading-relaxed;
}
:deep(.pdpa-content p) {
  @apply mb-4;
}
:deep(.pdpa-content strong) {
  @apply font-bold text-slate-800;
}
:deep(.pdpa-content ol) {
  @apply list-decimal pl-6 mb-4 space-y-2;
}
:deep(.pdpa-content ul) {
  @apply list-disc pl-6 mb-4 space-y-2;
}
:deep(.pdpa-content h1), :deep(.pdpa-content h2), :deep(.pdpa-content h3) {
  @apply font-bold text-slate-800 mt-6 mb-3;
}
</style>
