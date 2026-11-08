<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, buckets } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// The first jump from index 0 may land on 1, 2 or 3. Which landing cell is best?
const nums = [3, 1, 4, 2, 1, 1, 1]
const last = nums.length - 1
const lands = [1, 2, 3]
const pick = ref(1)
// fewest jumps from each cell to the end, by a simple backward table (only used to check the choice)
const need = nums.map(() => Infinity)
need[last] = 0
for (let i = last - 1; i >= 0; i--) for (let k = 1; k <= nums[i] && i + k <= last; k++) need[i] = Math.min(need[i], 1 + need[i + k])
const reach = (i: number) => i + nums[i]
const total = computed(() => 1 + need[pick.value])
const best = Math.min(...lands.map((l) => 1 + need[l]))
const panels = computed(() => [
  arr(nums, { label: 'nums. Bracket = cells the first jump can land on', tones: nums.map((_, k) => (k === pick.value ? 'focus' : k === 0 ? 'dim' : null)), window: [1, 3], pointers: [{ name: 'land', at: pick.value }] }),
  buckets(lands.map((l) => ({ key: `land on ${l}`, items: [`reach ${reach(l)}`], tone: l === pick.value ? ('focus' as const) : undefined })), { label: 'farthest the next jump gets you', keyLabel: 'choice' }),
])
</script>

<template>
  <div class="d">
    <div class="row" role="group" aria-label="Landing cell for the first jump">
      <button v-for="l in lands" :key="l" type="button" class="btn" :class="{ on: pick === l }" :aria-pressed="pick === l" @click="pick = l">Land on {{ l }}</button>
    </div>
    <PanelView v-for="(p, i) in panels" :key="i" :panel="p" />
    <p class="verdict" :class="{ bad: total > best }" role="status">
      <template v-if="total === best">Total {{ total }} jumps. This landing has the farthest reach, so it is the best choice.</template>
      <template v-else>Total {{ total }} jumps. Another landing reaches farther and needs only {{ best }}.</template>
    </p>
    <p class="muted small">The window algorithm never picks a cell. It keeps the largest reach, which is the best landing without trying each.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.row .btn.on { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
