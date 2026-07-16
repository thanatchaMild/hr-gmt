<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  required?: boolean
  hint?: string
  compact?: boolean
}>(), {
  required: false,
  compact: false
})
</script>

<template>
  <div>
    <label v-if="label" class="block font-medium text-slate-700 mb-1.5" :class="compact ? 'text-xs' : 'text-sm'">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <slot />
    <p v-if="hint" class="mt-1 text-xs text-slate-400">{{ hint }}</p>
  </div>
</template>
