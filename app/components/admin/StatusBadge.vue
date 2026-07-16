<script setup lang="ts">
withDefaults(defineProps<{
  text: string
  color?: 'yellow' | 'green' | 'blue' | 'red' | 'purple' | 'slate' | 'orange'
}>(), {
  color: 'slate'
})

const colorClasses: Record<string, string> = {
  yellow: 'bg-yellow-100 text-yellow-800',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  slate: 'bg-slate-100 text-slate-700',
  orange: 'bg-orange-100 text-orange-700'
}
</script>

<template>
  <span class="px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap" :class="colorClasses[color]">
    {{ text }}
  </span>
</template>
