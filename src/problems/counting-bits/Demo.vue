<script setup lang="ts">
import { computed, ref } from 'vue'
import { bits } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// i has the same 1 bits as i >> 1, plus one if its last bit is 1.
const i = ref(13)
const ones = (v: number) => v.toString(2).split('').filter((c) => c === '1').length
const half = computed(() => i.value >> 1)
const last = computed(() => i.value & 1)
const tones = (v: number, lastTone: 'focus' | null): ('focus' | 'keep' | null)[] =>
  Array.from({ length: 6 }, (_, k) => (k === 5 ? lastTone : (v >> (5 - k)) & 1 ? 'keep' : null))
const panel = computed(() =>
  bits(
    [
      { label: 'i', value: i.value, tones: tones(i.value, 'focus') },
      { label: 'i>>1', value: half.value, tones: tones(half.value, null) },
    ],
    { width: 6 },
  ),
)
</script>

<template>
  <div class="cb">
    <label>i <input v-model.number="i" type="range" min="0" max="63" step="1" aria-label="i, 0 to 63" /> <strong>{{ i }}</strong></label>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">
      Bits in {{ half }} = <strong>{{ ones(half) }}</strong>. Dropped bit = <strong>{{ last }}</strong>.
      So bits in {{ i }} = {{ ones(half) }} + {{ last }} = <strong>{{ ones(half) + last }}</strong>.
    </p>
    <p class="muted small">Slide i. The highlighted last digit of i is the one that gets dropped by i &gt;&gt; 1.</p>
  </div>
</template>

<style scoped>
.cb { display: grid; gap: 12px; }
label { display: flex; align-items: center; gap: 10px; font-weight: 600; }
input[type='range'] { flex: 1; min-height: 44px; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
