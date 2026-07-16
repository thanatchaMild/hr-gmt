<script setup lang="ts">
withDefaults(defineProps<{
  disabled?: boolean
}>(), {
  disabled: false
})

const model = defineModel<string | number | null>()
</script>

<template>
  <select
    v-model="model"
    :disabled="disabled"
    class="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 disabled:bg-slate-50 disabled:text-slate-400"
  >
    <slot />
  </select>
</template>
