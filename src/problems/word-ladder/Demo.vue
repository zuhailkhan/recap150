<script setup lang="ts">
import { computed, ref } from 'vue'
import { buckets } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Hide one letter at a time. Any list word that fits the same pattern is one letter away.
const list = ['hot', 'dot', 'dog', 'lot', 'log', 'cog', 'hit']
const word = ref('hot')
const patterns = computed(() => [...word.value].map((_, i) => word.value.slice(0, i) + '*' + word.value.slice(i + 1)))
const fits = (p: string) => list.filter((w) => w.length === p.length && [...w].every((c, i) => p[i] === '*' || p[i] === c))
const panel = computed(() => buckets(patterns.value.map((p) => ({ key: p, items: fits(p).filter((w) => w !== word.value), tone: fits(p).some((w) => w !== word.value) ? ('hit' as const) : ('dim' as const) })), { label: `patterns of "${word.value}" and the other list words that fit`, keyLabel: 'pattern', empty: 'type a word' }))
const neighbours = computed(() => [...new Set(patterns.value.flatMap((p) => fits(p)).filter((w) => w !== word.value))])
</script>

<template>
  <div class="wld">
    <label class="fld">Any word <input v-model="word" type="text" maxlength="5" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="Word to look up" /></label>
    <p class="muted small">List: {{ list.join(', ') }}</p>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">
      <template v-if="neighbours.length">One letter away: <strong>{{ neighbours.join(', ') }}</strong>.</template>
      <template v-else>No list word is one letter away from this.</template>
    </p>
    <p class="muted small">Try hit, then dog. One bucket lookup per pattern replaces comparing against every word.</p>
  </div>
</template>

<style scoped>
.wld { display: grid; gap: 10px; }
.fld { display: flex; align-items: center; gap: 10px; font-weight: 600; }
.fld input { min-height: 44px; width: 8em; padding: 0 10px; font-size: 1rem; font-family: var(--font-mono); border-radius: 10px; border: 1px solid var(--line); background: var(--surface); color: inherit; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
