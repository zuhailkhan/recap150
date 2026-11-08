<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Every speed is either too slow or fast enough, and the answers form one line: no, no, no, YES, YES, YES.
const piles = [3, 6, 7, 11]
const h = 8
const top = Math.max(...piles)
const speeds = Array.from({ length: top }, (_, i) => i + 1)
const hoursAt = (k: number) => piles.reduce((sum, p) => sum + Math.ceil(p / k), 0)
const speed = ref(3)
const hours = computed(() => hoursAt(speed.value))
const ok = computed(() => hours.value <= h)
const line = computed(() => arr(speeds, { label: 'every speed: red = too slow, green = fast enough', tones: speeds.map((k) => (k === speed.value ? 'focus' : hoursAt(k) <= h ? 'hit' : 'miss')), pointers: [{ name: 'try', at: speed.value - 1, tone: 'focus' }] }))
const per = computed(() => arr(piles.map((p) => Math.ceil(p / speed.value)), { label: `hours per pile at speed ${speed.value} (piles ${piles.join(', ')})`, tones: piles.map(() => (ok.value ? 'hit' : 'miss')) }))
</script>

<template>
  <div class="kd">
    <label class="ctl">Eating speed: <b>{{ speed }}</b> per hour (limit {{ h }} hours)
      <input v-model.number="speed" type="range" min="1" :max="top" step="1" />
    </label>
    <PanelView :panel="per" />
    <p class="say" :class="{ bad: !ok }" role="status">Total {{ hours }} hours. {{ ok ? 'Fast enough.' : 'Too slow.' }}</p>
    <PanelView :panel="line" />
    <p class="muted small">Drag the slider. The colours never flip back. That single switch from red to green is what binary search finds.</p>
  </div>
</template>

<style scoped>
.kd { display: grid; gap: 10px; }
.ctl { display: grid; gap: 4px; font-weight: 600; min-height: 44px; }
.ctl input { width: 100%; min-height: 32px; accent-color: var(--accent); }
.say { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.say.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
