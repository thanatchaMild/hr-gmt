<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  subtitle?: string
  color?: 'blue' | 'purple' | 'rose' | 'indigo'
}>(), {
  color: 'blue'
})

const colorClasses: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
  purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
  rose: 'from-rose-500 to-rose-600 shadow-rose-500/20',
  indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20'
}
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div class="flex items-center gap-4">
      <div
        class="w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg flex-shrink-0"
        :class="colorClasses[color]"
      >
        <slot name="icon" />
      </div>
      <div>
        <h2 class="text-xl font-bold text-slate-800 tracking-tight">{{ title }}</h2>
        <p v-if="subtitle" class="text-sm text-slate-500 mt-0.5">{{ subtitle }}</p>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <slot name="actions" />
    </div>
  </div>
</template>
