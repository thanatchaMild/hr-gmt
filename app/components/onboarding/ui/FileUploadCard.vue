<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  modelValue: File | string | null
  accept?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [File | null] }>()

const fileName = computed(() => {
  if (props.modelValue instanceof File) return props.modelValue.name
  if (typeof props.modelValue === 'string' && props.modelValue) return 'อัปโหลดแล้ว'
  return null
})

function onChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  emit('update:modelValue', file)
}
</script>

<template>
  <label
    class="relative flex items-start gap-3 border rounded-xl p-4 cursor-pointer transition-colors"
    :class="fileName ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'"
  >
    <div
      class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
      :class="fileName ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'"
    >
      <svg v-if="fileName" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
    </div>
    <div class="min-w-0">
      <p class="text-sm font-semibold text-slate-700">{{ label }}</p>
      <p class="text-xs mt-0.5 truncate" :class="fileName ? 'text-emerald-600' : 'text-slate-400'">
        {{ fileName || 'คลิกเพื่อเลือกไฟล์' }}
      </p>
    </div>
    <input type="file" :accept="accept" class="sr-only" @change="onChange">
  </label>
</template>
