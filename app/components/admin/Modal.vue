<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl'
  tone?: 'default' | 'danger'
}>(), {
  maxWidth: 'lg',
  tone: 'default'
})

const emit = defineEmits<{ close: [] }>()

const widthClasses: Record<string, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl'
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" @click.self="emit('close')">
      <div class="bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-[modal-in_0.15s_ease-out]" :class="widthClasses[maxWidth]">
        <div
          class="px-6 py-4 border-b flex justify-between items-center flex-shrink-0"
          :class="tone === 'danger' ? 'bg-red-50 border-red-100' : 'border-slate-200'"
        >
          <h3 class="text-lg font-bold" :class="tone === 'danger' ? 'text-red-800' : 'text-slate-800'">{{ title }}</h3>
          <button @click="emit('close')" class="p-1 rounded-full hover:bg-black/5 transition-colors" :class="tone === 'danger' ? 'text-red-400 hover:text-red-600' : 'text-slate-400 hover:text-slate-600'">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1">
          <slot />
        </div>
        <div v-if="$slots.footer" class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.97) translateY(4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
