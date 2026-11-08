<script setup lang="ts">
import { computed } from 'vue'
import type { ListPanel } from '@/core/panels'
const props = defineProps<{ p: ListPanel }>()
const BOX = 46, GAP = 34, PADX = 16, TOP = 22
const n = computed(() => props.p.items.length)
const cx = (i: number) => PADX + i * (BOX + GAP) + BOX / 2
const width = computed(() => PADX * 2 + n.value * (BOX + GAP) + 24)
const extra = computed(() => (props.p.cycleTo !== undefined || (props.p.links ?? []).length ? 44 : 0))
const height = computed(() => TOP + BOX + 30 + extra.value + ((props.p.pointers ?? []).length ? 12 : 0))
const cls = (i: number) => { const t = props.p.tones?.[i]; return t ? `t-${t}` : '' }
const ptrs = (i: number) => (props.p.pointers ?? []).filter((q) => q.at === i)
const under = (a: number, b: number, depth: number) => `M ${cx(a)} ${TOP + BOX + 16} C ${cx(a)} ${TOP + BOX + 16 + depth}, ${cx(b)} ${TOP + BOX + 16 + depth}, ${cx(b)} ${TOP + BOX + 18}`
</script>

<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="linked list">
    <defs><marker id="la" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="svarrow" /></marker></defs>
    <g v-for="(it, i) in p.items" :key="i">
      <rect class="svn" :class="cls(i)" :x="cx(i) - BOX / 2" :y="TOP" :width="BOX" :height="BOX" rx="10" />
      <text class="svt" :class="cls(i)" :x="cx(i)" :y="TOP + BOX / 2">{{ it }}</text>
      <template v-if="i < n - 1">
        <line class="sve" :x1="cx(i) + BOX / 2" :y1="TOP + BOX / 2 - (p.doubly ? 5 : 0)" :x2="cx(i + 1) - BOX / 2 - 2" :y2="TOP + BOX / 2 - (p.doubly ? 5 : 0)" marker-end="url(#la)" />
        <line v-if="p.doubly" class="sve" :x1="cx(i + 1) - BOX / 2" :y1="TOP + BOX / 2 + 5" :x2="cx(i) + BOX / 2 + 2" :y2="TOP + BOX / 2 + 5" marker-end="url(#la)" />
      </template>
      <text class="svs" :x="cx(i)" :y="TOP - 7">{{ i }}</text>
      <text v-for="(q, k) in ptrs(i)" :key="q.name" class="svs" :class="`t-${q.tone ?? 'focus'}`" font-weight="700" :x="cx(i)" :y="TOP + BOX + 12 + k * 11">{{ q.name }}</text>
    </g>
    <template v-if="n">
      <template v-if="p.cycleTo === undefined">
        <line class="sve" :x1="cx(n - 1) + BOX / 2" :y1="TOP + BOX / 2" :x2="cx(n - 1) + BOX / 2 + 18" :y2="TOP + BOX / 2" />
        <text class="svs" :x="cx(n - 1) + BOX / 2 + 32" :y="TOP + BOX / 2 + 3">null</text>
      </template>
      <path v-else class="sve" :d="under(n - 1, p.cycleTo, 28)" marker-end="url(#la)" stroke-dasharray="5 4" />
      <g v-for="(l, k) in p.links ?? []" :key="k">
        <path class="sve t-keep" :d="under(l.from, l.to, 20 + k * 8)" marker-end="url(#la)" stroke-dasharray="3 3" />
        <text v-if="l.label" class="svs t-keep" :x="(cx(l.from) + cx(l.to)) / 2" :y="TOP + BOX + 30 + k * 8">{{ l.label }}</text>
      </g>
    </template>
    <text v-else class="svs" x="40" y="48">empty (null)</text>
  </svg>
</template>
