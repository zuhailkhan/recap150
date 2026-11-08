<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import type { Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Slide the cut in a. The cut in b follows, so the left side always holds the same number of items.
const a = [2, 4, 7]
const b = [1, 3, 5, 6, 8, 9]
const half = Math.floor((a.length + b.length + 1) / 2)
const i = ref(0)
const j = computed(() => half - i.value)
const aLeft = computed(() => (i.value > 0 ? a[i.value - 1] : -Infinity))
const aRight = computed(() => (i.value < a.length ? a[i.value] : Infinity))
const bLeft = computed(() => (j.value > 0 ? b[j.value - 1] : -Infinity))
const bRight = computed(() => (j.value < b.length ? b[j.value] : Infinity))
const tooFar = computed(() => aLeft.value > bRight.value)
const tooShort = computed(() => bLeft.value > aRight.value)
const good = computed(() => !tooFar.value && !tooShort.value)
function cut(x: number[], k: number, leftEdge: Tone, rightEdge: Tone) {
  return arr([...x.slice(0, k), '|', ...x.slice(k)], { tones: [...x, 0].map((_, p) => (p === k - 1 ? leftEdge : p === k + 1 ? rightEdge : p < k ? 'keep' : p === k ? 'dim' : null)) })
}
const pa = computed(() => ({ ...cut(a, i.value, tooFar.value ? 'miss' : 'hit', tooShort.value ? 'miss' : 'hit'), label: 'a' }))
const pb = computed(() => ({ ...cut(b, j.value, tooShort.value ? 'miss' : 'hit', tooFar.value ? 'miss' : 'hit'), label: 'b' }))
</script>

<template>
  <div class="md2">
    <label class="ctl">Cut in a, after <b>{{ i }}</b> items (b is cut after <b>{{ j }}</b>)
      <input v-model.number="i" type="range" min="0" :max="a.length" step="1" />
    </label>
    <PanelView :panel="pa" />
    <PanelView :panel="pb" />
    <p class="say" :class="{ bad: !good }" role="status">
      <template v-if="good">Every item left of the cuts is no bigger than every item right of them. The median is built from the four items beside the cuts.</template>
      <template v-else-if="tooFar">A left item of a is bigger than a right item of b. The cut in a is too far right.</template>
      <template v-else>A left item of b is bigger than a right item of a. The cut in a is too far left.</template>
    </p>
    <p class="muted small">Both cuts always keep {{ half }} items on the left. Only the order across the cuts can be wrong, and binary search fixes that by moving the cut in a.</p>
  </div>
</template>

<style scoped>
.md2 { display: grid; gap: 10px; }
.ctl { display: grid; gap: 4px; font-weight: 600; min-height: 44px; }
.ctl input { width: 100%; min-height: 32px; accent-color: var(--accent); }
.say { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.say.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
