<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import type { Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// A square 1-2-3-4. Replay the copy calls with and without the map of copies.
const adj: Record<number, number[]> = { 1: [2, 4], 2: [1, 3], 3: [2, 4], 4: [1, 3] }
const useMap = ref(false)
const budget = ref(10)

const calls = computed(() => {
  const out: { val: number; reuse: boolean }[] = []
  const copies = new Set<number>()
  const dup = (v: number): void => {
    if (out.length >= budget.value) return
    if (useMap.value && copies.has(v)) { out.push({ val: v, reuse: true }); return }
    out.push({ val: v, reuse: false })
    copies.add(v)
    for (const n of adj[v]) dup(n)
  }
  dup(1)
  return out
})
const made = computed(() => calls.value.filter((c) => !c.reuse).length)
const panel = computed(() => arr(calls.value.map((c) => c.val), { label: 'calls in order (copy or reuse)', tones: calls.value.map((c): Tone => (c.reuse ? 'hit' : 'keep')) }))
</script>

<template>
  <div class="cgd">
    <label class="cgd-opt"><input v-model="useMap" type="checkbox" /> Keep a map of copies</label>
    <label class="cgd-fld">Calls shown: <strong>{{ budget }}</strong> <input v-model.number="budget" type="range" min="1" max="14" aria-label="Number of calls shown" /></label>
    <PanelView :panel="panel" />
    <p class="cgd-out" role="status">
      Copies made: <strong>{{ made }}</strong> for a 4-node graph.
      <span v-if="!useMap">No map: the walk goes around the square forever and every call makes yet another copy.</span>
      <span v-else>With the map: calls that meet a known node reuse its copy (green). It stops after 4 copies.</span>
    </p>
  </div>
</template>

<style scoped>
.cgd { display: grid; gap: 10px; }
.cgd-opt { display: flex; align-items: center; gap: 8px; min-height: 44px; font-weight: 600; }
.cgd-opt input { width: 22px; height: 22px; accent-color: var(--accent); }
.cgd-fld { display: grid; gap: 4px; font-weight: 600; }
.cgd-fld input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.cgd-out { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
</style>
