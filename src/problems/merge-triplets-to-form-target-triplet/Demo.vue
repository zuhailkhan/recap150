<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Merging keeps the max per slot, so one too-big triplet ruins its slot for good.
const target = [2, 7, 5]
const triplets = [[2, 5, 3], [1, 8, 4], [1, 7, 5]]
const used = ref([true, false, true])
const merged = computed(() => [0, 1, 2].map((j) => Math.max(0, ...triplets.filter((_, i) => used.value[i]).map((t) => t[j]))))
const anyUsed = computed(() => used.value.some(Boolean))
const tones = computed(() => merged.value.map((v, j) => (!anyUsed.value ? null : v > target[j] ? ('miss' as const) : v === target[j] ? ('hit' as const) : null)))
const state = computed(() => (!anyUsed.value ? 'none' : merged.value.some((v, j) => v > target[j]) ? 'over' : merged.value.every((v, j) => v === target[j]) ? 'win' : 'short'))
const panels = computed(() => [
  arr(target, { label: 'target' }),
  arr(anyUsed.value ? merged.value : ['-', '-', '-'], { label: 'merge of the ticked triplets (max per slot)', tones: tones.value }),
])
</script>

<template>
  <div class="d">
    <div class="picks" role="group" aria-label="Triplets to merge">
      <label v-for="(t, i) in triplets" :key="i" class="pick" :class="{ bad: t.some((v, j) => v > target[j]) }">
        <input v-model="used[i]" type="checkbox" /> [{{ t.join(', ') }}]
      </label>
    </div>
    <PanelView v-for="(p, i) in panels" :key="i" :panel="p" />
    <p class="verdict" :class="{ bad: state === 'over' || state === 'short' }" role="status">
      <template v-if="state === 'win'">Exactly the target. Both safe triplets merged, and the too-big one stayed out.</template>
      <template v-else-if="state === 'over'">A slot is above the target. It can never be lowered again. That triplet is poison.</template>
      <template v-else-if="state === 'short'">Under the target in a slot. Adding more safe triplets can still raise it.</template>
      <template v-else>Tick some triplets to merge.</template>
    </p>
    <p class="muted small">Tick the middle one, [1, 8, 4], and the middle slot jumps to 8, above the target of 7.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.picks { display: flex; gap: 8px; flex-wrap: wrap; }
.pick { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 12px; border: 1.5px solid var(--line); border-radius: 10px; font-weight: 600; }
.pick.bad { border-color: var(--miss-bd); }
.pick input { width: 22px; height: 22px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
