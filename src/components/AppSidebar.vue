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
.top { padding: 22px 18px 10px; display: grid; gap: 14px; }
.brand { font: 760 1.7rem var(--font-head); letter-spacing: -0.045em; color: var(--ink); text-decoration: none; line-height: 1; }
.brand span { font: 500 .88em var(--font-mono); letter-spacing: -0.05em; color: var(--ink-3); margin-left: 1px; }
.main-links { display: flex; gap: 2px; margin-left: -10px; }
.nav { display: inline-grid; place-items: center; min-height: 44px; padding: 0 10px; border-radius: 8px; color: var(--ink-2); text-decoration: none; font-weight: 560; font-size: .92rem; }
.nav:hover { color: var(--ink); background: var(--surface-2); }
.nav.router-link-exact-active { color: var(--ink); box-shadow: inset 0 -2px 0 var(--ink); border-radius: 0; }
.cats, .probs { list-style: none; margin: 0; padding: 0; }
.cats { padding: 4px 10px 28px; }
summary { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 44px; padding: 0 10px; border-radius: 8px; cursor: pointer; font-weight: 640; font-size: .93rem; list-style: none; letter-spacing: -0.005em; }
summary::-webkit-details-marker { display: none; }
summary::before { content: ''; width: 6px; height: 6px; border-right: 1.5px solid var(--ink-3); border-bottom: 1.5px solid var(--ink-3); transform: rotate(-45deg); margin-right: 8px; transition: transform .12s; flex: none; }
details[open] > summary::before { transform: rotate(45deg); }
summary .cn { flex: 1; }
summary:hover { background: var(--surface-2); }
.ct { font: 500 .74rem var(--font-mono); color: var(--ink-3); font-variant-numeric: tabular-nums; }
.probs { padding: 2px 0 10px 24px; margin-left: 12px; border-left: 1px solid var(--line); }
.prob { display: flex; align-items: center; gap: 10px; min-height: 40px; padding: 0 10px; border-radius: 7px; color: var(--ink-2); text-decoration: none; font-size: .9rem; }
.prob:hover { background: var(--surface-2); color: var(--ink); }
.prob.router-link-active { background: var(--ink); color: var(--bg); font-weight: 600; }
.prob.todo { color: var(--ink-3); }
.t { flex: 1; min-width: 0; }
.tag { font: 500 .68rem var(--font-mono); color: var(--ink-3); }
.router-link-active .tag { color: inherit; opacity: .7; }
/* memory state, drawn in ink: hollow = new, half = learning, full = mastered */
.dot { width: 11px; height: 11px; border-radius: 50%; border: 1.5px solid currentColor; flex: none; opacity: .55; }
.dot.learning { background: linear-gradient(90deg, currentColor 50%, transparent 50%); opacity: .9; }
.dot.mastered { background: currentColor; opacity: 1; }
.dot.none { border-style: dotted; opacity: .4; }
.find { display: grid; gap: 8px; padding: 6px 18px 12px; }
.find input, .find select { min-height: 44px; padding: 0 12px; font: .93rem var(--font-ui); color: var(--ink); background: var(--bg); border: 1.5px solid var(--line); border-radius: var(--radius-s); width: 100%; }
.find input::placeholder { color: var(--ink-3); }
.count { margin: 0; padding: 0 2px; }
</style>
