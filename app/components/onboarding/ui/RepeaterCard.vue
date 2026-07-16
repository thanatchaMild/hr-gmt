<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  removable?: boolean
}>(), {
  removable: true
})

const emit = defineEmits<{ remove: [] }>()
</script>

<template>
  <div class="relative bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5">
    <div v-if="title || removable" class="flex items-center justify-between mb-3">
      <p v-if="title" class="text-sm font-semibold text-slate-600">{{ title }}</p>
      <button
        v-if="removable"
        type="button"
        @click="emit('remove')"
        class="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-auto"
        aria-label="ลบรายการ"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div class="space-y-3">
      <slot />
    </div>
  </div>
</template>
