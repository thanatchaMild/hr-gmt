<script setup lang="ts">
withDefaults(defineProps<{
  type?: string
  placeholder?: string
  disabled?: boolean
  maxlength?: number
  /** Strip everything but digits as the user types (for ID card / phone number fields). */
  digitsOnly?: boolean
}>(), {
  type: 'text',
  disabled: false,
  digitsOnly: false
})

const model = defineModel<string | number | null>()

function onDigitsInput(e: Event) {
  const target = e.target as HTMLInputElement
  target.value = target.value.replace(/\D/g, '')
  model.value = target.value
}
</script>

<template>
  <input
    :value="model"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :maxlength="maxlength"
    :inputmode="digitsOnly ? 'numeric' : undefined"
    :pattern="digitsOnly ? '[0-9]*' : undefined"
    class="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 disabled:bg-slate-50 disabled:text-slate-400"
    @input="digitsOnly ? onDigitsInput($event) : (model = ($event.target as HTMLInputElement).value)"
  >
</template>
