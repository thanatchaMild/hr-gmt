// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    'nuxt-auth-utils'
  ],
  css: ['~/assets/css/tailwind.css'],
  future: {
    compatibilityVersion: 4,
  },
  app: {
    head: {
      title: 'HR Management',
      link: [
        { rel: 'icon', type: 'image/png', href: '/Logo_GM_small.png' }
      ]
    }
  }
})
