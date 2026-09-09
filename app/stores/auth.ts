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

  // null = no restriction (sees every hireType); otherwise the list of allowed codes.
  const allowedHireTypes = computed<string[] | null>(() => {
    if (!isHRAdmin.value) return null
    const scope = (user.value?.permissionsScope || '').trim()
    if (!scope || scope === 'ALL') return null
    if (scope === 'DAILY_ONLY') return ['DAILY', 'SUBCONTRACT', 'FIXED_TERM']
    if (scope === 'MONTHLY_ONLY') return ['MONTHLY']
    return scope.split(',').map(s => s.trim()).filter(Boolean)
  })

  const canManageHireType = (code: string) => {
    if (!isHRAdmin.value) return false
    return allowedHireTypes.value === null || allowedHireTypes.value.includes(code)
  }

  return {
    user,
    login,
    logout,
    isAdmin,
    isHRAdmin,
    isITAdmin,
    allowedHireTypes,
    canManageHireType
  }
})
