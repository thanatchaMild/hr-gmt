<script setup lang="ts">
import { NuxtLink } from '#components'

withDefaults(defineProps<{
  label: string
  value: string | number
  color?: 'blue' | 'purple' | 'rose' | 'green' | 'indigo'
  to?: string
  actionText?: string
}>(), {
  color: 'blue'
})

const colorClasses: Record<string, { bg: string; text: string; ring: string }> = {
  blue: { bg: 'from-blue-50 to-blue-100', text: 'text-blue-600', ring: 'text-blue-600' },
  purple: { bg: 'from-purple-50 to-purple-100', text: 'text-purple-600', ring: 'text-purple-600' },
  rose: { bg: 'from-rose-50 to-rose-100', text: 'text-rose-500', ring: 'text-rose-500' },
  green: { bg: 'from-emerald-50 to-emerald-100', text: 'text-emerald-600', ring: 'text-emerald-600' },
  indigo: { bg: 'from-indigo-50 to-indigo-100', text: 'text-indigo-600', ring: 'text-indigo-600' }
}
</script>

<template>
  <component
    :is="to ? NuxtLink : 'div'"
    :to="to"
    class="relative bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 block"
  >
    <div
      class="absolute right-0 top-0 w-28 h-28 bg-gradient-to-br rounded-bl-full opacity-60 transition-transform duration-300 group-hover:scale-110"
      :class="colorClasses[color].bg"
    ></div>
    <div class="relative z-10 flex justify-between items-start">
      <div>
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{{ label }}</h3>
        <p class="text-4xl font-extrabold tracking-tight" :class="colorClasses[color].text">{{ value }}</p>
      </div>
      <div class="w-12 h-12 rounded-xl flex items-center justify-center" :class="[colorClasses[color].bg, colorClasses[color].text]">
        <slot name="icon" />
      </div>
    </div>
    <div v-if="actionText" class="relative z-10 mt-4 flex items-center text-sm font-medium" :class="colorClasses[color].ring">
      <span class="group-hover:underline">{{ actionText }} &rarr;</span>
    </div>
  </component>
</template>
