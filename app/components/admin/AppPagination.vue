<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  currentPage: number
  totalItems: number
  itemsPerPage?: number
}>(), {
  itemsPerPage: 10
})

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
}>()

const totalPages = computed(() => Math.ceil(props.totalItems / props.itemsPerPage) || 1)

const startItem = computed(() => {
  if (props.totalItems === 0) return 0
  return (props.currentPage - 1) * props.itemsPerPage + 1
})

const endItem = computed(() => {
  return Math.min(props.currentPage * props.itemsPerPage, props.totalItems)
})

const pages = computed(() => {
  const total = totalPages.value
  const current = props.currentPage
  const delta = 1
  const range: (number | string)[] = []

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i)
    } else if (range[range.length - 1] !== '...') {
      range.push('...')
    }
  }
  return range
})

function setPage(p: number | string) {
  if (typeof p === 'number' && p >= 1 && p <= totalPages.value && p !== props.currentPage) {
    emit('update:currentPage', p)
  }
}
</script>

<template>
  <div v-if="totalItems > 0" class="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-white rounded-b-2xl">
    <div class="text-xs text-slate-500">
      แสดง <span class="font-semibold text-slate-700">{{ startItem }}-{{ endItem }}</span> จากทั้งหมด <span class="font-semibold text-slate-700">{{ totalItems }}</span> รายการ
    </div>

    <div v-if="totalPages > 1" class="flex items-center gap-1">
      <button
        type="button"
        @click="setPage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ย้อนกลับ
      </button>

      <template v-for="(p, idx) in pages" :key="idx">
        <span v-if="p === '...'" class="px-2 py-1 text-xs text-slate-400">...</span>
        <button
          v-else
          type="button"
          @click="setPage(p)"
          class="min-w-[32px] py-1.5 rounded-lg text-xs font-medium border transition-colors"
          :class="currentPage === p ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
        >
          {{ p }}
        </button>
      </template>

      <button
        type="button"
        @click="setPage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ถัดไป
      </button>
    </div>
  </div>
</template>
