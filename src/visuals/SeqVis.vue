<script setup lang="ts">
import { computed } from 'vue'
import type { SeqPanel } from '@/core/panels'
const props = defineProps<{ p: SeqPanel }>()

const COL = 138, PADX = 26, HEAD = 34, ROW = 40
const cx = (name: string) => PADX + COL / 2 + Math.max(0, props.p.actors.indexOf(name)) * COL
const width = computed(() => PADX * 2 + props.p.actors.length * COL)
const height = computed(() => HEAD + 26 + Math.max(1, props.p.messages.length) * ROW + 12)
const my = (i: number) => HEAD + 34 + i * ROW
const cls = (t?: string) => (t ? `t-${t}` : '')
const labelX = (m: SeqPanel['messages'][number]) => (m.from === m.to ? cx(m.from) + 52 : (cx(m.from) + cx(m.to)) / 2)
</script>

<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" style="max-width: 100%; height: auto" role="img" aria-label="sequence diagram">
    <defs>
      <marker id="sq-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="context-stroke" stroke-width="1.6" /></marker>
    </defs>
    <g v-for="a in p.actors" :key="a">
      <line class="life" :x1="cx(a)" :x2="cx(a)" :y1="HEAD" :y2="height - 6" />
      <rect class="svn" :x="cx(a) - 58" y="2" width="116" :height="HEAD - 6" rx="7" />
      <text class="svt" style="font-size: 12px" :x="cx(a)" :y="HEAD / 2 - 1">{{ a }}</text>
    </g>
    <g v-for="(m, i) in p.messages" :key="i">
      <template v-if="m.from !== m.to">
        <line class="sve msg" :class="[cls(m.tone), { dashed: m.dashed }]" :x1="cx(m.from)" :x2="cx(m.to) + (cx(m.to) > cx(m.from) ? -2 : 2)" :y1="my(i)" :y2="my(i)" marker-end="url(#sq-a)" />
      </template>
      <path v-else class="sve msg" :class="[cls(m.tone), { dashed: m.dashed }]" :d="`M ${cx(m.from)} ${my(i) - 8} h 40 v 18 h -38`" marker-end="url(#sq-a)" />
      <text class="lbl" :class="cls(m.tone)" :x="labelX(m)" :y="my(i) - 8" text-anchor="middle">{{ m.label }}</text>
    </g>
  </svg>
</template>

<style scoped>
.life { stroke: var(--line); stroke-width: 1.4; stroke-dasharray: 4 4; }
.msg { stroke-width: 1.8; }
.msg.dashed { stroke-dasharray: 5 4; }
.msg { stroke: var(--ink-2); }
.msg.t-focus { stroke: var(--focus-bd); } .msg.t-keep { stroke: var(--keep-bd); } .msg.t-hit { stroke: var(--hit-bd); } .msg.t-miss { stroke: var(--miss-bd); } .msg.t-dim { stroke: var(--dim-bd); }
.lbl { font: 500 11px var(--font-mono); fill: var(--ink); paint-order: stroke; stroke: var(--bg); stroke-width: 4px; stroke-linejoin: round; }
.lbl.t-focus { fill: var(--focus-fg); } .lbl.t-keep { fill: var(--keep-fg); } .lbl.t-hit { fill: var(--hit-fg); } .lbl.t-miss { fill: var(--miss-fg); } .lbl.t-dim { fill: var(--dim-fg); }
</style>
