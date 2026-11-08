<script setup lang="ts">
import { computed, ref } from 'vue'

// Two cars, target 12. The front car is at 6 with speed 2, so it needs 3 hours. Change the back car.
const target = 12
const front = { pos: 6, speed: 2 }
const backPos = ref(0)
const backSpeed = ref(2)

const frontTime = (target - front.pos) / front.speed
const backTime = computed(() => (target - backPos.value) / backSpeed.value)
const joins = computed(() => backTime.value <= frontTime)
const bar = (h: number) => `${Math.min(100, (h / 12) * 100)}%`
const fmt = (h: number) => +h.toFixed(2)
</script>

<template>
  <div class="cf">
    <label class="ctl">Back car speed: <strong>{{ backSpeed }}</strong>
      <input v-model.number="backSpeed" type="range" min="1" max="12" step="1" />
    </label>
    <label class="ctl">Back car start: <strong>{{ backPos }}</strong>
      <input v-model.number="backPos" type="range" min="0" max="5" step="1" />
    </label>
    <div class="bars" role="img" :aria-label="`Front car needs ${fmt(frontTime)} hours, back car needs ${fmt(backTime)} hours`">
      <div class="line"><span class="name">Front car (6, speed 2)</span><div class="track"><div class="fill keep" :style="{ width: bar(frontTime) }">{{ fmt(frontTime) }} h</div></div></div>
      <div class="line"><span class="name">Back car ({{ backPos }}, speed {{ backSpeed }})</span><div class="track"><div class="fill" :class="joins ? 'hit' : 'miss'" :style="{ width: bar(backTime) }">{{ fmt(backTime) }} h</div></div></div>
    </div>
    <p class="verdict" :class="joins ? 'hit' : 'miss'" role="status">
      <template v-if="joins">Back car needs {{ fmt(backTime) }} h, not more than {{ fmt(frontTime) }} h. It catches up and slows down: 1 fleet.</template>
      <template v-else>Back car needs {{ fmt(backTime) }} h, more than {{ fmt(frontTime) }} h. It never catches up: 2 fleets.</template>
    </p>
    <p class="muted small">A shorter bar than the car ahead means the car catches up. The same length means they arrive together.</p>
  </div>
</template>

<style scoped>
.cf { display: grid; gap: 10px; }
.ctl { display: grid; gap: 4px; font-weight: 600; }
.ctl input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.bars { display: grid; gap: 8px; }
.line { display: grid; gap: 4px; }
.name { font-size: 0.9rem; color: var(--ink-2); }
.track { background: var(--surface-2); border: 2px solid var(--line); border-radius: 10px; overflow: hidden; }
.fill { min-width: 3.5rem; padding: 6px 10px; font-weight: 700; font-family: var(--font-mono); border-right: 2px solid transparent; }
.fill.keep { background: var(--keep-bg); color: var(--keep-fg); border-color: var(--keep-bd); }
.fill.hit, .verdict.hit { background: var(--hit-bg); color: var(--hit-fg); border-color: var(--hit-bd); }
.fill.miss, .verdict.miss { background: var(--miss-bg); color: var(--miss-fg); border-color: var(--miss-bd); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid; }
</style>
