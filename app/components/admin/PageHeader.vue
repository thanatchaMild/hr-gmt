<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  subtitle?: string
  color?: 'blue' | 'purple' | 'rose' | 'indigo'
  /** Full-width gradient banner (IT pages) instead of the plain title row. */
  hero?: boolean
}>(), {
  color: 'blue',
  hero: false,
})

const colorClasses: Record<string, string> = {
  blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
  purple: 'from-purple-500 to-purple-600 shadow-purple-500/20',
  rose: 'from-rose-500 to-rose-600 shadow-rose-500/20',
  indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20'
}

const heroClasses: Record<string, string> = {
  blue: 'from-blue-600 via-sky-600 to-cyan-500 shadow-blue-500/20',
  purple: 'from-violet-600 via-purple-600 to-indigo-600 shadow-purple-500/25',
  rose: 'from-rose-600 via-pink-600 to-fuchsia-600 shadow-rose-500/20',
  indigo: 'from-indigo-600 via-blue-600 to-sky-600 shadow-indigo-500/20'
}
</script>

<template>
  <div
    v-if="hero"
    class="hero-header relative overflow-hidden rounded-2xl bg-gradient-to-r px-5 py-5 sm:px-7 sm:py-6 mb-6 text-white shadow-lg"
    :class="heroClasses[color]"
  >
    <!-- decorative glows -->
    <div class="pointer-events-none absolute -right-10 -top-16 w-56 h-56 rounded-full bg-white/10 blur-2xl"></div>
    <div class="pointer-events-none absolute right-40 -bottom-20 w-48 h-48 rounded-full bg-fuchsia-300/20 blur-2xl"></div>
    <div class="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4 min-w-0">
        <div class="w-12 h-12 rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur flex items-center justify-center flex-shrink-0">
          <slot name="icon" />
        </div>
        <div class="min-w-0">
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight">{{ title }}</h2>
          <p v-if="subtitle" class="text-sm text-white/75 mt-0.5">{{ subtitle }}</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <slot name="actions" />
      </div>
    </div>
  </div>

  <div v-else class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div class="flex items-center gap-4">
      <div
        class="w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg flex-shrink-0"
        :class="colorClasses[color]"
      >
        <slot name="icon" />
      </div>
      <div>
        <h2 class="text-xl font-bold text-slate-800 tracking-tight">{{ title }}</h2>
        <p v-if="subtitle" class="text-sm text-slate-500 mt-0.5">{{ subtitle }}</p>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
/* Buttons placed in the banner's actions slot: frosted white instead of the plain outline style. */
.hero-header :deep(.ui-btn-outline) {
  background-color: rgb(255 255 255 / 0.15);
  border-color: rgb(255 255 255 / 0.3);
  color: #fff;
}
.hero-header :deep(.ui-btn-outline:hover) {
  background-color: rgb(255 255 255 / 0.25);
}
.hero-header :deep(.ui-btn-outline svg) {
  color: #fff;
}
</style>
