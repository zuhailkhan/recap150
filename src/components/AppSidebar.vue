<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { categoryList, metas } from '@/data/problems'
import { progress } from '@/recap/store'
import { isMastered } from '@/recap/sm2'

const emit = defineEmits<{ navigate: [] }>()
const route = useRoute()
const open = ref(new Set<string>())

const currentCat = computed(() => {
  const slug = route.params.slug as string | undefined
  return slug ? metas.get(slug)?.category ?? categoryList.find((c) => c.entries.some((e) => e.slug === slug))?.name : undefined
})
watch(currentCat, (c) => { if (c) open.value.add(c) }, { immediate: true })

function onToggle(name: string, e: Event) {
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
    <ul class="cats">
      <li v-for="c in categoryList" :key="c.name">
        <details :open="open.has(c.name)" @toggle="onToggle(c.name, $event)">
          <summary><span class="cn">{{ c.name }}</span><span class="ct">{{ c.ready }}/{{ c.entries.length }}</span></summary>
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
