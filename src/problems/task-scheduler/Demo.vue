<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Every tick: run the ready task with the most copies left. Slide the cooldown n and watch idle slots appear.
const counts: Record<string, number> = { A: 3, B: 3, C: 1 }
const n = ref(2)

const timeline = computed(() => {
  const left = { ...counts }
  const back: Record<string, number> = {}
  const out: string[] = []
  for (let time = 1; Object.values(left).some((v) => v > 0); time++) {
    const ready = Object.keys(left).filter((k) => left[k] > 0 && (back[k] ?? 0) <= time).sort((a, b) => left[b] - left[a])
    if (!ready.length) { out.push('idle'); continue }
    left[ready[0]]--
    back[ready[0]] = time + n.value + 1
    out.push(ready[0])
  }
  return out
})
const idle = computed(() => timeline.value.filter((x) => x === 'idle').length)
const panel = computed(() => arr(timeline.value, { label: `schedule for A x3, B x3, C x1 with n = ${n.value}`, tones: timeline.value.map((x): Tone => (x === 'idle' ? 'miss' : 'keep')) }))
</script>

<template>
  <div class="d">
    <PanelView :panel="panel" />
    <label class="lab">Cooldown n = {{ n }}
      <input v-model.number="n" class="rng" type="range" min="0" max="5" />
    </label>
    <p class="verdict" role="status">{{ timeline.length }} time units, {{ idle }} of them idle. A longer cooldown forces idle slots, because the busiest tasks are still resting.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.lab { display: grid; gap: 4px; }
.rng { min-height: 44px; width: 100%; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
