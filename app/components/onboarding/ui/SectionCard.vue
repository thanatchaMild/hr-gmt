<script setup lang="ts">
defineProps<{
  number: number | string
  title: string
  subtitle?: string
}>()
</script>

<template>
  <section class="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
    <div class="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
      <div class="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
        {{ number }}
      </div>
      <div>
        <h3 class="font-bold text-slate-800 leading-tight">{{ title }}</h3>
        <p v-if="subtitle" class="text-xs text-slate-400 mt-0.5">{{ subtitle }}</p>
      </div>
    </div>
    <div class="space-y-4">
      <slot />
    </div>
  </section>
</template>
