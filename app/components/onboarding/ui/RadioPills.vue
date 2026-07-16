<script setup lang="ts">
interface Option {
  value: string
  label: string
  subLabel?: string
}

withDefaults(defineProps<{
  options: Option[]
  name: string
  disabled?: boolean
}>(), {
  disabled: false
})

const model = defineModel<string | boolean | null>()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <label
      v-for="opt in options"
      :key="String(opt.value)"
      class="relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors select-none"
      :class="[
        model === opt.value
          ? 'bg-primary-50 border-primary-400 text-primary-700'
          : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400',
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      ]"
    >
      <input
        type="radio"
        :name="name"
        :value="opt.value"
        v-model="model"
        :disabled="disabled"
        class="sr-only peer"
      >
      <span
        class="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-colors"
        :class="model === opt.value ? 'border-primary-600 bg-primary-600 ring-2 ring-primary-100' : 'border-slate-300'"
      ></span>
      <span>{{ opt.label }}<span v-if="opt.subLabel" class="text-xs opacity-70 ml-1">{{ opt.subLabel }}</span></span>
    </label>
  </div>
</template>
