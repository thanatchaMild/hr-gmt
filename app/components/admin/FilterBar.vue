<script setup lang="ts">
// Toolbar at the top of a data card: search box (searches as you type) + filter controls in one wrapping row.
const props = defineProps<{
  placeholder?: string
  /** Show the "ล้างตัวกรอง" link (some filter is set). */
  active?: boolean
}>()

const search = defineModel<string>('search', { default: '' })
const emit = defineEmits<{ submit: []; reset: [] }>()

// Search as you type: submit once typing pauses; Enter still submits immediately.
const DEBOUNCE_MS = 400
let timer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(timer)
  timer = setTimeout(() => emit('submit'), DEBOUNCE_MS)
})
function submitNow() {
  clearTimeout(timer)
  emit('submit')
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="filter-bar flex flex-wrap items-center gap-2 p-3 sm:p-4 border-b border-slate-100">
    <form class="relative w-full sm:w-72" @submit.prevent="submitNow">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
      <input v-model="search" type="search" :placeholder="props.placeholder || 'ค้นหา...'" class="ui-input w-full pl-9" />
    </form>
    <slot />
    <button v-if="active" type="button" class="ui-btn-ghost text-xs" @click="emit('reset')">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      ล้างตัวกรอง
    </button>
    <div class="ml-auto flex items-center gap-2">
      <slot name="end" />
    </div>
  </div>
</template>

<style scoped>
/* Phones: two filter controls per row instead of one full-width row each. */
@media (max-width: 639px) {
  .filter-bar > :deep(select),
  .filter-bar > :deep(label),
  .filter-bar > :deep(div:not(.ml-auto)) {
    flex: 1 1 calc(50% - 0.25rem);
    min-width: 0;
    max-width: none;
  }
}
</style>
