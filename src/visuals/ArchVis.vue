<script setup lang="ts">
import { computed } from 'vue'
import type { ArchNode, ArchPanel } from '@/core/panels'
const props = defineProps<{ p: ArchPanel }>()

const W = 760, H = 440, NW = 124, NH = 56
const px = (n: ArchNode) => 20 + (n.x / 100) * (W - 40)
const py = (n: ArchNode) => 24 + (n.y / 100) * (H - 48)
const byId = computed(() => new Map(props.p.nodes.map((n) => [n.id, n])))
const tone = (id: string) => props.p.tones?.[id]
const cls = (id: string) => (tone(id) ? `t-${tone(id)}` : '')

const segs = computed(() => props.p.edges.filter((e) => byId.value.has(e.from) && byId.value.has(e.to)).map((e) => {
  const a = byId.value.get(e.from)!, b = byId.value.get(e.to)!
  const ax = px(a), ay = py(a), bx = px(b), by = py(b)
  const dx = bx - ax, dy = by - ay
  const clip = (cx: number, cy: number, tx: number, ty: number) => {
    const ddx = tx - cx, ddy = ty - cy
    const k = Math.min((NW / 2 + 3) / Math.abs(ddx || 1e-9), (NH / 2 + 3) / Math.abs(ddy || 1e-9))
    return { x: cx + ddx * k, y: cy + ddy * k }
  }
  let s = clip(ax, ay, bx, by), t = clip(bx, by, ax, ay)
  // two arrows between the same pair of nodes: push each sideways so both stay visible
  if (props.p.edges.some((o) => o.from === e.to && o.to === e.from)) {
    const len = Math.hypot(dx, dy) || 1, off = 7
    const ox = (-dy / len) * off, oy = (dx / len) * off
    s = { x: s.x + ox, y: s.y + oy }; t = { x: t.x + ox, y: t.y + oy }
  }
  return { e, s, t, mx: (s.x + t.x) / 2, my: (s.y + t.y) / 2, flat: Math.abs(dy) < Math.abs(dx) && dx !== 0 }
}))
const labelOf = (n: ArchNode) => n.label
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" style="width: 100%; min-width: 500px; max-width: 860px; height: auto" role="img" aria-label="architecture diagram">
    <defs>
      <marker id="ar-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" stroke="context-stroke" stroke-width="1.7" /></marker>
    </defs>
    <g v-for="(s, i) in segs" :key="i">
      <line class="edge" :class="[s.e.tone ? `t-${s.e.tone}` : '', { dashed: s.e.dashed }]" :x1="s.s.x" :y1="s.s.y" :x2="s.t.x" :y2="s.t.y" marker-end="url(#ar-a)" />
    </g>
    <g v-for="n in p.nodes" :key="n.id" :transform="`translate(${px(n)} ${py(n)})`">
      <!-- shape by kind: the silhouette tells you what it is before you read the label -->
      <path v-if="n.kind === 'db'" class="svn" :class="cls(n.id)" :d="`M ${-NW / 2 + 6} ${-NH / 2 + 8} v ${NH - 16} a ${NW / 2 - 6} 9 0 0 0 ${NW - 12} 0 v ${-(NH - 16)} a ${NW / 2 - 6} 9 0 0 0 ${-(NW - 12)} 0 z`" />
      <path v-if="n.kind === 'db'" class="svn cap" :class="cls(n.id)" :d="`M ${-NW / 2 + 6} ${-NH / 2 + 8} a ${NW / 2 - 6} 9 0 0 0 ${NW - 12} 0`" />
      <polygon v-else-if="n.kind === 'lb'" class="svn" :class="cls(n.id)" :points="`${-NW / 2 + 14},${-NH / 2} ${NW / 2 - 14},${-NH / 2} ${NW / 2},0 ${NW / 2 - 14},${NH / 2} ${-NW / 2 + 14},${NH / 2} ${-NW / 2},0`" />
      <ellipse v-else-if="n.kind === 'cdn'" class="svn" :class="cls(n.id)" :rx="NW / 2" :ry="NH / 2" stroke-dasharray="0" />
      <path v-else-if="n.kind === 'blob'" class="svn" :class="cls(n.id)" :d="`M ${-NW / 2 + 4} ${-NH / 2} h ${NW - 8} l -8 ${NH} h ${-(NW - 24)} z`" />
      <g v-else-if="n.kind === 'queue'">
        <rect class="svn" :class="cls(n.id)" :x="-NW / 2" :y="-NH / 2" :width="NW" :height="NH" rx="6" />
        <line v-for="k in 3" :key="k" class="qdiv" :x1="-NW / 2 + k * (NW / 4)" :x2="-NW / 2 + k * (NW / 4)" :y1="-NH / 2 + 4" :y2="-NH / 2 + 12" />
      </g>
      <rect v-else class="svn" :class="[cls(n.id), { soft: n.kind === 'worker' || n.kind === 'external' }]" :x="-NW / 2" :y="-NH / 2" :width="NW" :height="NH" :rx="n.kind === 'client' ? 16 : 7" />
      <text class="svt nl" :class="cls(n.id)" x="0" :y="n.sub ? -5 : 0">{{ labelOf(n) }}</text>
      <text v-if="n.sub" class="svs ns" :class="cls(n.id)" x="0" y="12">{{ n.sub }}</text>
    </g>
    <!-- labels are drawn last, so a node never covers them -->
    <g v-for="(s, i) in segs" :key="'l' + i">
      <text v-if="s.e.label" class="el" :x="s.mx" :y="s.my - 5" text-anchor="middle">{{ s.e.label }}</text>
    </g>
  </svg>
</template>

<style scoped>
.edge { stroke: var(--ink-3); stroke-width: 1.8; fill: none; }
.edge.dashed { stroke-dasharray: 6 5; }
.edge.t-focus { stroke: var(--focus-bd); stroke-width: 2.6; } .edge.t-keep { stroke: var(--keep-bd); } .edge.t-hit { stroke: var(--hit-bd); stroke-width: 2.6; } .edge.t-miss { stroke: var(--miss-bd); } .edge.t-dim { stroke: var(--dim-bd); }
.el { font: 500 12px var(--font-mono); fill: var(--ink-2); paint-order: stroke; stroke: var(--bg); stroke-width: 4px; stroke-linejoin: round; }
.nl { font: 650 14px var(--font-ui); }
.ns { font: 500 11px var(--font-mono); }
.svn { stroke-width: 1.8; }
.svn.cap { fill: none; }
.svn.soft { stroke-dasharray: 5 3; }
.qdiv { stroke: var(--tile-bd); stroke-width: 1.5; }
</style>
