<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import { progress } from '@/recap/store'

const route = useRoute()
const drawer = ref(false)
type Theme = 'auto' | 'light' | 'dark'
const theme = ref<Theme>('auto')

function applyTheme() {
  const el = document.documentElement
  if (theme.value === 'auto') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', theme.value)
  try { localStorage.setItem('recap150-theme', theme.value) } catch { /* storage blocked: theme just will not persist */ }
}
function cycleTheme() { theme.value = theme.value === 'auto' ? 'light' : theme.value === 'light' ? 'dark' : 'auto'; applyTheme() }
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') drawer.value = false }

onMounted(() => {
  try { const t = localStorage.getItem('recap150-theme'); if (t === 'light' || t === 'dark') theme.value = t } catch { /* ignore */ }
  applyTheme()
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
watch(() => route.fullPath, () => (drawer.value = false))
</script>

<template>
  <a class="skip" href="#main">Skip to content</a>
  <div class="shell">
    <aside id="nav" class="app-nav" :class="{ open: drawer }" aria-label="Site">
      <AppSidebar @navigate="drawer = false" />
    </aside>
    <div v-if="drawer" class="scrim" @click="drawer = false"></div>
    <div class="col">
      <header class="appbar">
        <button class="btn quiet menu" type="button" :aria-expanded="drawer" aria-controls="nav" @click="drawer = !drawer">
          <span aria-hidden="true">☰</span><span class="sr-only">Menu</span>
        </button>
        <router-link class="brand" to="/">Recap<span>150</span></router-link>
        <span class="grow"></span>
        <router-link class="btn quiet" to="/recap">Recap</router-link>
        <button class="btn quiet" type="button" :aria-label="`Theme: ${theme}. Change theme`" @click="cycleTheme">{{ theme === 'auto' ? 'Auto' : theme === 'light' ? 'Light' : 'Dark' }}</button>
      </header>
      <p v-if="progress.storageError" class="banner" role="alert">{{ progress.storageError }}</p>
      <main id="main" tabindex="-1"><router-view /></main>
    </div>
  </div>
</template>

<style>
.skip { position: absolute; left: -999px; top: 8px; z-index: 100; background: var(--accent); color: var(--accent-ink); padding: 10px 14px; border-radius: 8px; }
.skip:focus { left: 8px; }
.shell { display: grid; grid-template-columns: minmax(0, 1fr); min-height: 100dvh; }
.col { min-width: 0; display: flex; flex-direction: column; }
.appbar { display: flex; align-items: center; gap: 6px; padding: 6px var(--gutter); border-bottom: 1px solid var(--line); background: var(--bg); position: sticky; top: 0; z-index: 20; min-height: 56px; }
.appbar .brand { font: 700 1.3rem var(--font-head); color: var(--ink); text-decoration: none; }
.appbar .brand span { color: var(--accent); }
.grow { flex: 1; }
main { padding: 24px var(--gutter) 72px; min-width: 0; outline: none; }
.banner { margin: 0; padding: 10px var(--gutter); background: var(--miss-bg); color: var(--miss-fg); font-size: .9rem; }
.app-nav { position: fixed; z-index: 40; inset: 0 auto 0 0; width: min(88vw, 340px); background: var(--surface); border-right: 1px solid var(--line); overflow-y: auto; overscroll-behavior: contain; visibility: hidden; transform: translateX(-100%); transition: transform .2s, visibility .2s; }
.app-nav.open { visibility: visible; transform: none; }
.scrim { position: fixed; inset: 0; z-index: 30; background: rgb(0 0 0 / 45%); }
@media (min-width: 1024px) {
  .shell { grid-template-columns: 300px minmax(0, 1fr); }
  .app-nav { position: sticky; top: 0; height: 100dvh; width: auto; visibility: visible; transform: none; z-index: 1; }
  .appbar .menu, .appbar .brand { display: none; }
  .appbar { justify-content: flex-end; padding-inline: 40px; }
  main { padding: 36px 40px 96px; }
}
@media (min-width: 1700px) { main { padding-inline: 64px; } }
</style>
