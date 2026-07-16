<script setup lang="ts">
withDefaults(defineProps<{
  message: string
}>(), {})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-14 text-slate-400 gap-3">
    <div class="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
      <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
    </div>
    <p class="text-sm font-medium">{{ message }}</p>
  </div>
</template>
