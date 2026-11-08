<script setup lang="ts">
import { computed } from 'vue'
import type { IntervalsPanel } from '@/core/panels'
const props = defineProps<{ p: IntervalsPanel }>()
const lo = computed(() => props.p.min ?? Math.min(0, ...props.p.spans.map((s) => s.start), ...(props.p.marks ?? []).map((m) => m.at)))
const hi = computed(() => props.p.max ?? Math.max(1, ...props.p.spans.map((s) => s.end), ...(props.p.marks ?? []).map((m) => m.at)))
const PAD = 24, ROW = 30
const U = computed(() => Math.max(18, Math.min(44, 520 / Math.max(1, hi.value - lo.value))))
const X = (v: number) => PAD + (v - lo.value) * U.value
const width = computed(() => PAD * 2 + (hi.value - lo.value) * U.value)
const height = computed(() => 32 + Math.max(1, props.p.spans.length) * ROW + 14)
const ticks = computed(() => Array.from({ length: Math.floor(hi.value - lo.value) + 1 }, (_, i) => lo.value + i))
const w = (s: { start: number; end: number }) => Math.max(8, (s.end - s.start) * U.value)
</script>

<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="intervals on a number line">
    <line class="sve" :x1="X(lo)" :x2="X(hi)" y1="16" y2="16" />
    <g v-for="t in ticks" :key="t"><line class="sve" :x1="X(t)" :x2="X(t)" y1="12" y2="20" /><text class="svs" :x="X(t)" y="8">{{ t }}</text></g>
    <g v-for="(m, i) in p.marks ?? []" :key="'m' + i"><line class="sve t-miss" stroke-dasharray="4 3" :x1="X(m.at)" :x2="X(m.at)" y1="20" :y2="height - 12" /><text class="svs t-miss" :x="X(m.at)" :y="height - 2">{{ m.label ?? m.at }}</text></g>
    <g v-for="(s, i) in p.spans" :key="i">
      <rect class="svn" :class="`t-${s.tone ?? 'keep'}`" :x="X(s.start)" :y="30 + i * ROW" :width="w(s)" height="22" rx="7" />
      <text class="svt" :class="`t-${s.tone ?? 'keep'}`" style="font-size: 11px" :x="X(s.start) + w(s) / 2" :y="30 + i * ROW + 11">{{ s.label ?? `[${s.start},${s.end}]` }}</text>
    </g>
  </svg>
</template>
