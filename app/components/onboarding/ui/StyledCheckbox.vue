<script setup lang="ts">
withDefaults(defineProps<{
  disabled?: boolean
}>(), {
  disabled: false
})

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <div class="relative flex items-center justify-center w-6 h-6 shrink-0">
    <input
      type="checkbox"
      v-model="model"
      :disabled="disabled"
      class="peer appearance-none w-6 h-6 border-2 border-slate-300 bg-white rounded-md checked:bg-primary-600 checked:border-primary-600 transition-all focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2 disabled:bg-slate-200 disabled:border-slate-300 cursor-inherit"
    >
    <svg class="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </div>
</template>
