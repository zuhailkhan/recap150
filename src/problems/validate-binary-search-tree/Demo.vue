<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, tree } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// The tree is [5, 4, 8, null, null, x, 9]. x is the left child of 8, so it sits in the right subtree of 5.
const x = ref(3)
const value = computed(() => (Number.isFinite(x.value) ? Math.trunc(x.value) : 0))
const parentOnly = computed(() => value.value < 8)
const inWindow = computed(() => value.value > 5 && value.value < 8)
const panel = computed(() =>
  tree([5, 4, 8, null, null, value.value, 9], { label: 'change the value of the highlighted node', tones: [null, null, null, null, null, inWindow.value ? 'hit' : 'miss', null], pointers: [{ name: 'x', at: 5 }] }),
)
const bounds = computed(() => arr(['low 5', value.value, 'high 8'], { label: 'window for x: above 5 and below 8', tones: ['keep', inWindow.value ? 'hit' : 'miss', 'keep'] }))
</script>

<template>
  <div class="d">
    <label class="opt">Value of x <input v-model.number="x" type="number" step="1" inputmode="numeric" /></label>
    <PanelView :panel="panel" />
    <PanelView :panel="bounds" />
    <p class="verdict" :class="{ bad: !parentOnly }" role="status">Parent-only check (x &lt; 8): <strong>{{ parentOnly ? 'looks fine' : 'invalid' }}</strong></p>
    <p class="verdict" :class="{ bad: !inWindow }" role="status">Window check (5 &lt; x &lt; 8): <strong>{{ inWindow ? 'valid' : 'invalid' }}</strong></p>
    <p class="muted small">Try x = 3. The parent-only check says fine, the window says no. Then try 6 or 7.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.opt { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 600; }
.opt input { width: 6rem; min-height: 44px; padding: 0 10px; font: inherit; border-radius: 10px; border: 2px solid var(--line); background: var(--tile-bg); color: var(--tile-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
