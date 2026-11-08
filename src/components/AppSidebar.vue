<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { categoryList, metas } from '@/data/problems'
import { progress } from '@/recap/store'
import { dayNumber, isDue, isMastered, isWeak } from '@/recap/sm2'

const emit = defineEmits<{ navigate: [] }>()
const route = useRoute()
const open = ref(new Set<string>())

const currentCat = computed(() => {
  const slug = route.params.slug as string | undefined
  return slug ? metas.get(slug)?.category ?? categoryList.find((c) => c.entries.some((e) => e.slug === slug))?.name : undefined
})
watch(currentCat, (c) => { if (c) open.value.add(c) }, { immediate: true })

const query = ref('')
const filter = ref<'all' | 'written' | 'due' | 'weak' | 'todo'>('all')
const searching = computed(() => query.value.trim() !== '' || filter.value !== 'all')

function keep(e: { slug: string; title: string; category: string; status: string }): boolean {
  const q = query.value.trim().toLowerCase()
  if (q && !(e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.slug.includes(q))) return false
  const card = progress.cards.get(e.slug)
  switch (filter.value) {
    case 'written': return e.status === 'ready'
    case 'todo': return e.status !== 'ready'
    case 'due': return !!card && isDue(card, dayNumber(Date.now()))
    case 'weak': return !!card && isWeak(card)
    default: return true
  }
}
const shown = computed(() => categoryList.map((c) => ({ ...c, entries: c.entries.filter((e) => keep({ ...e, category: c.name })) })).filter((c) => c.entries.length))
const matchCount = computed(() => shown.value.reduce((n, c) => n + c.entries.length, 0))

function onToggle(name: string, e: Event) {
  if (searching.value) return
  if ((e.target as HTMLDetailsElement).open) open.value.add(name)
  else open.value.delete(name)
}
function dot(slug: string) {
  const c = progress.cards.get(slug)
  return !c || c.last === 0 ? 'new' : isMastered(c) ? 'mastered' : 'learning'
}
const dotLabel = { new: 'not reviewed yet', learning: 'in review', mastered: 'mastered' }
</script>

<template>
  <nav class="sb" aria-label="Problems">
    <div class="top">
      <router-link class="brand" to="/" @click="emit('navigate')">Recap<span>150</span></router-link>
      <div class="main-links">
        <router-link class="nav" to="/" @click="emit('navigate')">Overview</router-link>
        <router-link class="nav" to="/recap" @click="emit('navigate')">Recap</router-link>
        <router-link class="nav" to="/settings" @click="emit('navigate')">Backup</router-link>
      </div>
    </div>
    <div class="find">
      <label class="sr-only" for="sb-q">Search problems</label>
      <input id="sb-q" v-model="query" type="search" placeholder="Search problems" autocomplete="off" spellcheck="false" />
      <label class="sr-only" for="sb-f">Filter</label>
      <select id="sb-f" v-model="filter">
        <option value="all">All problems</option><option value="written">Written</option><option value="due">Due today</option><option value="weak">Weak spots</option><option value="todo">Not written yet</option>
      </select>
      <p v-if="searching" class="muted small count" role="status">{{ matchCount }} match{{ matchCount === 1 ? '' : 'es' }}</p>
    </div>
    <ul class="cats">
      <li v-for="c in shown" :key="c.name">
        <details :open="searching || open.has(c.name)" @toggle="onToggle(c.name, $event)">
          <summary><span class="cn">{{ c.name }}</span><span class="ct">{{ searching ? c.entries.length : c.ready + '/' + c.entries.length }}</span></summary>
          <ul class="probs">
            <li v-for="p in c.entries" :key="p.slug">
              <router-link v-if="p.status !== 'todo'" class="prob" :to="`/p/${p.slug}`" @click="emit('navigate')">
                <span class="dot" :class="dot(p.slug)" role="img" :aria-label="dotLabel[dot(p.slug)]"></span>
                <span class="t">{{ p.title }}</span>
                <span v-if="p.status === 'draft'" class="tag">draft</span>
              </router-link>
              <router-link v-else class="prob todo" :to="`/p/${p.slug}`" @click="emit('navigate')">
                <span class="dot none" aria-hidden="true"></span><span class="t">{{ p.title }}</span><span class="tag">soon</span>
              </router-link>
            </li>
          </ul>
        </details>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.sb { display: flex; flex-direction: column; min-height: 100%; }
.top { padding: 14px 12px 8px; display: grid; gap: 10px; }
.brand { font: 700 1.5rem var(--font-head); color: var(--ink); text-decoration: none; padding: 0 6px; }
.brand span { color: var(--accent); }
.main-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.nav { display: grid; place-items: center; min-height: 44px; border-radius: 10px; color: var(--ink); text-decoration: none; font-weight: 600; font-size: .9rem; }
.nav:hover { background: var(--surface-2); }
.nav.router-link-exact-active { background: var(--accent-soft); }
.cats, .probs { list-style: none; margin: 0; padding: 0; }
.find { display: grid; gap: 6px; padding: 4px 12px 8px; }
.find input, .find select { min-height: 44px; padding: 0 12px; font: .95rem var(--font-body); color: var(--ink); background: var(--bg); border: 1.5px solid var(--line); border-radius: 10px; width: 100%; }
.count { margin: 0; padding: 0 4px; }
.cats { padding: 4px 8px 24px; }
summary { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; padding: 0 10px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: .92rem; list-style: none; }
summary::-webkit-details-marker { display: none; }
summary:hover { background: var(--surface-2); }
.ct { font: 500 .78rem var(--font-mono); color: var(--ink-2); }
.probs { padding: 2px 0 8px 8px; }
.prob { display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 10px; border-radius: 10px; color: var(--ink); text-decoration: none; font-size: .9rem; }
.prob:hover { background: var(--surface-2); }
.prob.router-link-active { background: var(--accent-soft); font-weight: 600; }
.prob.todo { color: var(--ink-2); }
.t { flex: 1; min-width: 0; }
.tag { font: 600 .68rem var(--font-body); text-transform: uppercase; letter-spacing: .06em; color: var(--ink-2); }
.dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--tile-bd); flex: none; }
.dot.learning { background: linear-gradient(90deg, var(--focus-bd) 50%, transparent 50%); border-color: var(--focus-bd); }
.dot.mastered { background: var(--hit-bd); border-color: var(--hit-bd); }
.dot.none { border-style: dotted; opacity: .6; }
</style>
