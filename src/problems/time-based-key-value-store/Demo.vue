<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// For a query time, timestamps up to it are "not too new" and the rest are. The answer is the last "not too new" one.
const times = [2, 5, 9, 12, 17]
const values = ['a', 'b', 'c', 'd', 'e']
const query = ref(10)
const last = computed(() => times.filter((x) => x <= query.value).length - 1)
const tsPanel = computed(() => arr(times, { label: 'timestamps (green: not after the query, red: too new)', tones: times.map((x, i) => (i === last.value ? 'hit' : x <= query.value ? 'keep' : 'miss')), pointers: last.value >= 0 ? [{ name: 'answer', at: last.value, tone: 'hit' }] : [] }))
const valPanel = computed(() => arr(values, { label: 'values', tones: values.map((_, i) => (i === last.value ? 'hit' : null)) }))
</script>

<template>
  <div class="tm">
    <label class="ctl">Query time: <b>{{ query }}</b>
      <input v-model.number="query" type="range" min="0" max="20" step="1" />
    </label>
    <PanelView :panel="tsPanel" />
    <PanelView :panel="valPanel" />
    <p class="say" role="status">
      <template v-if="last >= 0">The last time not after {{ query }} is {{ times[last] }}, so get returns "{{ values[last] }}".</template>
      <template v-else>Every stored time is after {{ query }}, so get returns an empty string.</template>
    </p>
    <p class="muted small">The timestamps are sorted, so "not too new" always switches to "too new" exactly once. Binary search finds that switch.</p>
  </div>
</template>

<style scoped>
.tm { display: grid; gap: 10px; }
.ctl { display: grid; gap: 4px; font-weight: 600; min-height: 44px; }
.ctl input { width: 100%; min-height: 32px; accent-color: var(--accent); }
.say { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
</style>
