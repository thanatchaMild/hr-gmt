<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from '~/stores/onboarding'
import { consentHtml } from '~/utils/consentContent'
import AppButton from '~/components/onboarding/ui/AppButton.vue'
import RadioPills from '~/components/onboarding/ui/RadioPills.vue'

const store = useOnboardingStore()
const router = useRouter()

const consentChoice = ref<string | null>(null)
const signature = ref('')
const signatureCanvas = ref<HTMLCanvasElement | null>(null)
const contentContainer = ref<HTMLElement | null>(null)
const isDrawing = ref(false)
const hasScrolledToBottom = ref(false)

const consentOptions = [
  { value: 'agree', label: '"ให้" ความยินยอม' },
  { value: 'disagree', label: '"ไม่ให้" ความยินยอม' }
]

function checkScroll(e: Event) {
  if (hasScrolledToBottom.value) return
  const target = e.target as HTMLElement
  // Check if scrolled near bottom (within 50px)
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 50) {
    hasScrolledToBottom.value = true
  }
}


function resizeCanvas() {
  const canvas = signatureCanvas.value
  if (!canvas) return
  // Don't override with style.height = '100%' as it collapses the canvas when parent has no fixed height
  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight
}

onMounted(() => {
  window.addEventListener('resize', resizeCanvas)
  setTimeout(() => {
    resizeCanvas()
    // Initial check if content is too short to scroll
    if (contentContainer.value) {
      if (contentContainer.value.scrollHeight <= contentContainer.value.clientHeight + 10) {
        hasScrolledToBottom.value = true
      }
    }
  }, 100)
})

watch(hasScrolledToBottom, async (newVal) => {
  if (newVal) {
    await nextTick()
    resizeCanvas()
  }
})

function startDraw(e: MouseEvent | TouchEvent) {
  isDrawing.value = true
  draw(e)
}

function stopDraw() {
  isDrawing.value = false
  const canvas = signatureCanvas.value
  if (canvas) {
    signature.value = canvas.toDataURL('image/png')
  }
}

function draw(e: MouseEvent | TouchEvent) {
  if (!isDrawing.value) return
  const canvas = signatureCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return

  const rect = canvas.getBoundingClientRect()
  let x = 0
  let y = 0

  if (e instanceof MouseEvent) {
    x = e.clientX - rect.left
    y = e.clientY - rect.top
  } else {
    x = e.touches[0].clientX - rect.left
    y = e.touches[0].clientY - rect.top
  }

  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.strokeStyle = '#1e40af' // blue-800

  ctx.lineTo(x, y)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x, y)
}

function clearSignature() {
  const canvas = signatureCanvas.value
  const ctx = canvas?.getContext('2d')
  if (canvas && ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()
    signature.value = ''
  }
}

function proceed() {
  if (!consentChoice.value) {
    alert('กรุณาเลือกให้ความยินยอม หรือไม่ให้ความยินยอม')
    return
  }
  if (consentChoice.value === 'disagree') {
    // If they do not consent, we might stop them from proceeding or store it anyway.
    // For now we will allow them to proceed but we store the choice.
    // In a real scenario, not consenting might block the onboarding.
    const confirmDisagree = confirm('หากคุณไม่ให้ความยินยอม อาจส่งผลให้บริษัทไม่สามารถดำเนินการรับเข้าทำงานได้ ยืนยันที่จะไม่ให้ความยินยอมหรือไม่?')
    if (!confirmDisagree) return
  }

  if (!signature.value) {
    alert('กรุณาลงลายมือชื่ออิเล็กทรอนิกส์')
    return
  }

  // Update store (we use agreePdpa which just sets pdpaConsent and signature)
  // Optionally, you might want to add pdpaConsentChoice to the store later.
  if (consentChoice.value === 'agree') {
    store.agreePdpa(signature.value)
  } else {
    // Modify store logic if needed. Let's just set agreePdpa anyway to store the signature.
    // In a full implementation, we'd add `isConsentGiven` boolean. For now pdpaConsent is true if they sign.
    store.agreePdpa(signature.value)
    store.pdpaConsent = false // Override to false if they specifically disagreed
  }

  router.push('/onboarding/form')
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Main Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-4">
      <!-- Content -->
      <div
        ref="contentContainer"
        class="p-6 md:p-8 max-h-[50vh] overflow-y-auto styled-scrollbar relative"
        @scroll="checkScroll"
      >
        <div class="mb-6 text-center flex flex-col items-center">
          <img src="/Logo_GM_Large.png" alt="GMT Logo" class="h-10 md:h-12 mb-2 object-contain">
          <h1 class="text-xl md:text-2xl font-bold text-slate-800">หนังสือให้ความยินยอม</h1>
          <p class="mt-1 text-sm text-slate-500 font-medium">เก็บรวมรวบ ใช้ และ/หรือเปิดเผยข้อมูลส่วนบุคคล</p>
        </div>

        <div class="consent-content" v-html="consentHtml"></div>
      </div>

      <!-- Action Area -->
      <div class="p-6 md:p-8 border-t border-slate-200 transition-colors duration-500" :class="hasScrolledToBottom ? 'bg-slate-50' : 'bg-slate-100'">
        <div v-if="!hasScrolledToBottom" class="text-center text-sm font-medium text-amber-600 mb-3 bg-amber-50 py-2 px-4 rounded-lg border border-amber-100 w-full">
          ↓ กรุณาเลื่อนอ่านรายละเอียดให้ครบถ้วนก่อน เพื่อทำรายการต่อ
        </div>

        <div v-show="hasScrolledToBottom">
          <div class="mb-6 p-4 rounded-xl border border-slate-200 shadow-sm bg-white transition-all duration-300">
            <p class="text-slate-700 font-medium text-sm leading-relaxed mb-4">
              ข้าพเจ้าซึ่งเป็นผู้สมัครเข้าเป็นพนักงาน /ผู้สมัครเข้าฝึกงาน / ผู้ฝึกงาน ของ บริษัท ยิปมั่นเทค จำกัด
            </p>
            <RadioPills v-model="consentChoice" name="consentChoice" :options="consentOptions" />
            <p class="text-slate-600 text-sm mt-4 leading-relaxed">
              ให้บริษัทเก็บรวบรวม ใช้ หรือเปิดเผยข้อมูลส่วนบุคคลของข้าพเจ้าที่มีอยู่ กับ บริษัท ยิปมั่นเทค จำกัด ดังที่ปรากฎตามประกาศความเป็นส่วนตัวและข้อกำหนดเงื่อนไข
            </p>
          </div>

          <!-- Signature Area -->
          <div class="mt-6 transition-all duration-300" :class="consentChoice ? 'opacity-100 translate-y-0 h-auto' : 'opacity-50 translate-y-4 pointer-events-none'">
            <div class="flex items-center justify-between mb-3 px-1">
              <p class="text-sm font-semibold text-slate-700">ลงลายมือชื่ออิเล็กทรอนิกส์</p>
              <AppButton variant="outline" size="sm" @click="clearSignature">
                <template #icon-left>
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </template>
                ล้างลายเซ็น
              </AppButton>
            </div>
            <div class="relative bg-white rounded-xl overflow-hidden border-2 border-dashed border-slate-300 focus-within:border-primary-400 focus-within:border-solid transition-colors">
              <canvas
                ref="signatureCanvas"
                class="w-full h-40 md:h-48 cursor-crosshair touch-none"
                @mousedown="startDraw"
                @mousemove="draw"
                @mouseup="stopDraw"
                @mouseleave="stopDraw"
                @touchstart.prevent="startDraw"
                @touchmove.prevent="draw"
                @touchend.prevent="stopDraw"
              ></canvas>

              <!-- Placeholder hint -->
              <div v-if="!signature && !isDrawing" class="absolute inset-0 pointer-events-none flex items-center justify-center">
                <span class="text-slate-300 font-medium">กรุณาใช้เมาส์หรือนิ้วเซ็นชื่อที่นี่</span>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div class="mt-8 flex justify-end">
            <AppButton size="lg" :disabled="!consentChoice || !signature" @click="proceed">
              เข้าสู่หน้าฟอร์มกรอกข้อมูล
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
  </div>
</template>

<style scoped>
:deep(.consent-content) {
  @apply text-slate-700 text-sm md:text-base leading-relaxed;
}
:deep(.consent-content p) {
  @apply mb-4;
}
:deep(.consent-content strong) {
  @apply font-bold text-slate-800;
}
:deep(.consent-content ol) {
  @apply list-decimal pl-6 mb-4 space-y-2;
}
:deep(.consent-content ul) {
  @apply list-disc pl-6 mb-4 space-y-2;
}
:deep(.consent-content h1), :deep(.consent-content h2), :deep(.consent-content h3) {
  @apply font-bold text-slate-800 mt-6 mb-3;
}
</style>
