// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxt/icon'],
  css: ['~/assets/main.scss'],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // additionalData: '@import "~/assets/main.scss";',
        },
      },
    },
  },
  compatibilityDate: '2025-03-01',
})