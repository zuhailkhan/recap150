<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, buckets } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Same sorted list, same search. Only the duplicate skipping changes.
const a = [-2, -2, 0, 0, 2, 2]
const skip = ref(false)
const found = computed(() => {
  const out: number[][] = []
  for (let i = 0; i < a.length - 2; i++) {
    if (skip.value && i > 0 && a[i] === a[i - 1]) continue
    let l = i + 1, r = a.length - 1
    while (l < r) {
      const s = a[i] + a[l] + a[r]
      if (s < 0) l++
      else if (s > 0) r--
      else {
        out.push([a[i], a[l], a[r]])
        l++; r--
        if (skip.value) {
          while (l < r && a[l] === a[l - 1]) l++
          while (l < r && a[r] === a[r + 1]) r--
        }
      }
    }
  }
  return out
})
const dupes = computed(() => found.value.length - new Set(found.value.map((x) => x.join())).size)
const panel = computed(() => buckets(found.value.map((x, k) => ({ key: `#${k + 1}`, items: x, tone: k > 0 && found.value.slice(0, k).some((y) => y.join() === x.join()) ? 'miss' : 'hit' as const })), { label: 'triples found', keyLabel: 'triple', empty: 'none' }))
</script>

<template>
  <div class="d">
    <PanelView :panel="arr(a, { label: 'sorted input' })" />
    <label class="opt"><input v-model="skip" type="checkbox" /> Skip repeated values</label>
    <PanelView :panel="panel" />
    <p class="v" :class="{ bad: dupes > 0 }" role="status">
      <template v-if="dupes > 0">{{ found.length }} triples, but only {{ found.length - dupes }} different. Red ones are copies.</template>
      <template v-else>{{ found.length }} triple, no copies. Each value is used as a first, left or right number only once.</template>
    </p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.opt { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 600; }
.opt input { width: 22px; height: 22px; accent-color: var(--accent); }
.v { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.v.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
