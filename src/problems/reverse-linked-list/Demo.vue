<script setup lang="ts">
import { computed, ref } from 'vue'
import { list } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Cutting a link before saving what it pointed to loses the rest of the list.
const saved = ref(false)
const vals = [1, 2, 3, 4]
const panel = computed(() =>
  saved.value
    ? list([1], { label: 'cur is flipped. next still holds the rest', tones: ['hit'], pointers: [{ name: 'cur', at: 0 }] })
    : list([1], { label: 'cur is flipped. nothing holds the rest', tones: ['hit'], pointers: [{ name: 'cur', at: 0 }] }),
)
const rest = computed(() => list([2, 3, 4], { label: saved.value ? 'reachable through next' : 'lost: no pointer leads here', tones: vals.slice(1).map(() => (saved.value ? 'keep' : 'miss')), pointers: saved.value ? [{ name: 'next', at: 0, tone: 'keep' }] : [] }))
</script>

<template>
  <div class="d">
    <label class="opt"><input v-model="saved" type="checkbox" /> Save <code>cur.next</code> before flipping</label>
    <PanelView :panel="panel" />
    <PanelView :panel="rest" />
    <p class="verdict" :class="{ bad: !saved }" role="status">
      <template v-if="saved">Safe. The rest of the list is still reachable, so the loop can continue.</template>
      <template v-else>Broken. After <code>cur.next = prev</code>, nothing points at 2, 3, 4 any more.</template>
    </p>
    <p class="muted small">Toggle the box. This one habit is the whole trick.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.opt { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 600; }
.opt input { width: 22px; height: 22px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
