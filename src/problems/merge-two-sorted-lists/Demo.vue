<script setup lang="ts">
import { computed, ref } from 'vue'
import { list } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// With a fake head, linking the first pick is the same line as linking every other pick.
const picked = ref(0)
const useDummy = ref(true)
const merged = [1, 1, 2, 3]
const panel = computed(() => {
  const cells = merged.slice(0, picked.value)
  const items = useDummy.value ? ['D', ...cells] : cells
  const last = items.length - 1
  return list(items, {
    label: 'merged so far',
    tones: items.map((_, i) => (useDummy.value && i === 0 ? 'dim' : 'keep')),
    pointers: last >= 0 ? [{ name: 'tail', at: last, tone: 'hit' }] : [],
  })
})
const special = computed(() => !useDummy.value && picked.value === 0)
</script>

<template>
  <div class="d">
    <label class="opt"><input v-model="useDummy" type="checkbox" /> Start with a fake head node (D)</label>
    <label class="opt">Nodes merged so far: {{ picked }}
      <input v-model.number="picked" type="range" min="0" max="4" aria-label="Nodes merged so far" />
    </label>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: special }" role="status">
      <template v-if="special">No node yet, so tail points at nothing. The first pick needs its own case: <code>head = pick</code>.</template>
      <template v-else>The next pick is always <code>tail.next = pick</code>. No special case, even at zero nodes.</template>
    </p>
    <p class="muted small">Drag the slider to 0 and untick the box. That is the one moment the fake head saves you.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.opt { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; min-height: 44px; font-weight: 600; }
.opt input[type='checkbox'] { width: 22px; height: 22px; accent-color: var(--accent); }
.opt input[type='range'] { flex: 1; min-width: 140px; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
