<script setup lang="ts">
import { computed, ref } from 'vue'
import { list } from '@/core/panels'
import type { Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Two pointers n apart. When fast is on the last node, slow stands just before the n-th from the end.
const LEN = 6
const n = ref(2)
const items = ['D', ...Array.from({ length: LEN }, (_, i) => i + 1)]
const slowAt = computed(() => LEN - n.value)
const victim = computed(() => LEN - n.value + 1)
const panel = computed(() =>
  list(items, {
    label: 'when fast reaches the last node',
    tones: items.map((_, i): Tone | null => (i === victim.value ? 'miss' : i === 0 ? 'dim' : null)),
    pointers: [
      { name: 'slow', at: slowAt.value },
      { name: 'fast', at: LEN, tone: 'keep' },
    ],
  }),
)
</script>

<template>
  <div class="d">
    <label class="opt">n = {{ n }}
      <input v-model.number="n" type="range" min="1" max="6" aria-label="n, counted from the end" />
    </label>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">
      fast is {{ n }} nodes ahead of slow. The red node ({{ victim }}) is number {{ n }} from the end, and it sits right after slow.
      <template v-if="n === LEN"> slow is still on D, so the head is removed with the same line as any other node.</template>
    </p>
    <p class="muted small">Move the slider to {{ LEN }}. Without D there would be no node before the head.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.opt { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; min-height: 44px; font-weight: 600; }
.opt input[type='range'] { flex: 1; min-width: 140px; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
