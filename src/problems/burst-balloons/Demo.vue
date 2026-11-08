<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick which balloon is burst LAST in the whole row. The two sides are solved on their own.
const a = [1, 3, 1, 5, 1]
const k = ref(2)
const best = (l: number, r: number): number => {
  let b = 0
  for (let x = l + 1; x < r; x++) b = Math.max(b, best(l, x) + a[l] * a[x] * a[r] + best(x, r))
  return b
}
const left = computed(() => best(0, k.value))
const right = computed(() => best(k.value, a.length - 1))
const edge = computed(() => a[0] * a[k.value] * a[a.length - 1])
const panel = computed(() => arr(a, {
  label: 'padded row, ends are the 1s that stay',
  tones: a.map((_, i) => (i === k.value ? 'focus' : i === 0 || i === a.length - 1 ? 'keep' : i < k.value ? 'dim' : 'dim')),
  pointers: [{ name: 'l', at: 0 }, { name: 'k', at: k.value, tone: 'focus' }, { name: 'r', at: a.length - 1 }],
}))
</script>

<template>
  <div class="bbd">
    <label class="fld">Last balloon k (position): <strong>{{ k }}</strong> <input v-model.number="k" type="range" min="1" max="3" aria-label="Last balloon position k" /></label>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">
      Burst {{ k }} (value {{ a[k] }}) last. Left side {{ left }}, right side {{ right }}, and the last burst scores {{ a[0] }}*{{ a[k] }}*{{ a[a.length - 1] }} = {{ edge }}. Total {{ left }} + {{ edge }} + {{ right }} = <strong>{{ left + edge + right }}</strong>.
    </p>
    <p class="muted small">Move k. When k goes last, its neighbours are the two ends, whatever the sides did. The best k wins: that is dp[0][4].</p>
  </div>
</template>

<style scoped>
.bbd { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
</style>
