<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { computed } from 'vue'

const props = defineProps<{
  requiredRole?: 'HR_ADMIN' | 'IT_ADMIN'
  employeeScope?: 'DAILY' | 'MONTHLY'
}>()

const authStore = useAuthStore()

const hasPermission = computed(() => {
  if (!authStore.user) return false

  // Check role
  if (props.requiredRole && authStore.user.role !== props.requiredRole) {
    return false
  }

  // Check scope if HR Admin
  if (props.employeeScope && authStore.user.role === 'HR_ADMIN') {
    if (props.employeeScope === 'DAILY' && !authStore.canManageDaily) return false
    if (props.employeeScope === 'MONTHLY' && !authStore.canManageMonthly) return false
  }

  return true
})
</script>

<template>
  <slot v-if="hasPermission" />
  <slot name="fallback" v-else>
    <div class="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="font-medium">Access Denied</span>
      </div>
      <p class="mt-1 text-sm">You do not have permission to view this content.</p>
    </div>
  </slot>
</template>
