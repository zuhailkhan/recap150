<script setup lang="ts">
import { computed, ref } from 'vue'
import { list } from '@/core/panels'
import type { Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// The three moves on plain arrays: split, reverse the second half, weave.
const n = ref(6)
const nums = computed(() => Array.from({ length: n.value }, (_, i) => i + 1))
const mid = computed(() => Math.ceil(n.value / 2))
const firstHalf = computed(() => nums.value.slice(0, mid.value))
const second = computed(() => nums.value.slice(mid.value))
const reversed = computed(() => [...second.value].reverse())
const woven = computed(() => {
  const out: number[] = []
  firstHalf.value.forEach((v, i) => {
    out.push(v)
    if (i < reversed.value.length) out.push(reversed.value[i])
  })
  return out
})
const p1 = computed(() => list(nums.value, { label: '1. the list, split in the middle', tones: nums.value.map((_, i): Tone => (i < mid.value ? 'keep' : 'focus')), pointers: [{ name: 'slow', at: mid.value - 1 }] }))
const p2 = computed(() => list(reversed.value, { label: '2. second half, reversed', tones: reversed.value.map((): Tone => 'focus') }))
const p3 = computed(() => list(woven.value, { label: '3. woven: first half, reversed half, alternating', tones: woven.value.map((v): Tone => (v <= mid.value ? 'keep' : 'focus')) }))
</script>

<template>
  <div class="d">
    <label class="opt">Nodes: {{ n }}
      <input v-model.number="n" type="range" min="2" max="9" aria-label="Number of nodes" />
    </label>
    <PanelView :panel="p1" />
    <PanelView :panel="p2" />
    <PanelView :panel="p3" />
    <p class="muted small">One colour is the first half, the other is the second half read from the back. With an odd count the first half keeps the extra node.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.opt { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; min-height: 44px; font-weight: 600; }
.opt input[type='range'] { flex: 1; min-width: 140px; min-height: 44px; accent-color: var(--accent); }
</style>
