<script setup lang="ts">
import { computed, ref } from 'vue'
import { trie } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Stored words: bad, dad, mad, dot. Type a pattern with dots. The dfs lists every prefix it tried.
const stored = ['bad', 'dad', 'mad', 'dot']
const text = ref('d.t')
const pattern = computed(() => text.value.toLowerCase().replace(/[^a-z.]/g, ''))

// Prefixes that are real nodes of the trie.
const nodes = new Set<string>([''])
for (const w of stored) for (let i = 1; i <= w.length; i++) nodes.add(w.slice(0, i))

const run = computed(() => {
  const p = pattern.value
  const tried: string[] = []
  const dfs = (path: string): boolean => {
    if (path.length === p.length) return stored.includes(path)
    const letters = p[path.length] === '.' ? [...new Set(stored.filter((w) => w.startsWith(path)).map((w) => w[path.length]))] : [p[path.length]]
    for (const ch of letters) {
      const next = path + ch
      if (!nodes.has(next)) { tried.push(`${next} (no node)`); continue }
      tried.push(next)
      if (dfs(next)) return true
    }
    return false
  }
  const ok = p.length > 0 && dfs('')
  return { tried, ok, winner: ok ? stored.find((w) => w.length === p.length && [...w].every((c, i) => p[i] === '.' || p[i] === c)) ?? '' : '' }
})
const panel = computed(() => trie(stored, { label: 'stored: bad, dad, mad, dot', hot: run.value.winner, hotTone: 'hit' }))
</script>

<template>
  <div class="d">
    <label class="lab" for="wild-q">Pattern (letters and dots)</label>
    <input id="wild-q" v-model="text" class="inp" maxlength="6" autocomplete="off" autocapitalize="off" spellcheck="false" />
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: !run.ok }" role="status">
      <template v-if="pattern === ''">Type a pattern such as d.t or ...</template>
      <template v-else>{{ run.ok ? 'Match.' : 'No match.' }} Prefixes tried, in order: {{ run.tried.length ? run.tried.join(', ') : 'none' }}.</template>
    </p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.lab { font-weight: 600; }
.inp { min-height: 44px; padding: 0 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
