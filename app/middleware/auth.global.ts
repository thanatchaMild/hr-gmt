export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return

  const { loggedIn, user, fetch } = useUserSession()

  if (import.meta.server || !loggedIn.value) {
    await fetch()
  }

  if (!loggedIn.value) {
    return navigateTo('/login')
  }

  if (to.path.startsWith('/admin/hr') && user.value?.role !== 'HR_ADMIN') {
    return navigateTo('/admin')
  }

  if (to.path.startsWith('/admin/it') && user.value?.role !== 'IT_ADMIN') {
    return navigateTo('/admin')
  }
})
