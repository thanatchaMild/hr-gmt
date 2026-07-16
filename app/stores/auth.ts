import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const { user, loggedIn, fetch: refreshSession, clear } = useUserSession()

  const login = async (username: string, password: string) => {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username, password }
    })
    await refreshSession()
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
  }

  const isAdmin = computed(() => loggedIn.value)
  const isHRAdmin = computed(() => user.value?.role === 'HR_ADMIN')
  const isITAdmin = computed(() => user.value?.role === 'IT_ADMIN')

  const canManageDaily = computed(() => {
    if (!isHRAdmin.value) return false
    return user.value?.permissionsScope === 'ALL' || user.value?.permissionsScope === 'DAILY_ONLY'
  })

  const canManageMonthly = computed(() => {
    if (!isHRAdmin.value) return false
    return user.value?.permissionsScope === 'ALL' || user.value?.permissionsScope === 'MONTHLY_ONLY'
  })

  return {
    user,
    login,
    logout,
    isAdmin,
    isHRAdmin,
    isITAdmin,
    canManageDaily,
    canManageMonthly
  }
})
