<script setup lang="ts">
import { computed } from 'vue'
import type { ClassesPanel } from '@/core/panels'
const props = defineProps<{ p: ClassesPanel }>()

const CW = 7.3, LINE = 17, PAD = 12, GAPX = 64, GAPY = 54, MARGIN = 14
interface Box { name: string; kind: string; fields: string[]; methods: string[]; w: number; h: number; x: number; y: number; hasMid: boolean }

const layout = computed(() => {
  const boxes = props.p.classes.map((c) => {
    const fields = c.fields ?? [], methods = c.methods ?? []
    const longest = Math.max(c.name.length + (c.kind && c.kind !== 'class' ? 4 : 0), ...fields.map((f) => f.length), ...methods.map((m) => m.length))
    const head = 30 + (c.kind && c.kind !== 'class' ? 12 : 0)
    const h = head + (fields.length ? fields.length * LINE + 10 : 0) + (methods.length ? methods.length * LINE + 10 : 0) + (fields.length || methods.length ? 0 : 6)
    return { name: c.name, kind: c.kind ?? 'class', fields, methods, w: Math.max(110, longest * CW + PAD * 2), h, x: c.x, y: c.y, hasMid: !!fields.length && !!methods.length }
  })
  const cols = Math.max(0, ...boxes.map((b) => b.x)) + 1, rows = Math.max(0, ...boxes.map((b) => b.y)) + 1
  const colW = Array.from({ length: cols }, (_, i) => Math.max(0, ...boxes.filter((b) => b.x === i).map((b) => b.w)))
  const rowH = Array.from({ length: rows }, (_, i) => Math.max(0, ...boxes.filter((b) => b.y === i).map((b) => b.h)))
  const colX = colW.map((_, i) => MARGIN + colW.slice(0, i).reduce((a, w) => a + w + GAPX, 0))
  const rowY = rowH.map((_, i) => MARGIN + rowH.slice(0, i).reduce((a, h) => a + h + GAPY, 0))
  const placed = boxes.map((b) => ({ ...b, px: colX[b.x] + (colW[b.x] - b.w) / 2, py: rowY[b.y] + (rowH[b.y] - b.h) / 2 }))
  return { placed, width: MARGIN * 2 + colW.reduce((a, w) => a + w, 0) + GAPX * Math.max(0, cols - 1), height: MARGIN * 2 + rowH.reduce((a, h) => a + h, 0) + GAPY * Math.max(0, rows - 1) }
})

const byName = computed(() => new Map(layout.value.placed.map((b) => [b.name, b])))
/** Point where the line from a box centre toward (tx, ty) leaves the box edge. */
function edgePoint(b: { px: number; py: number; w: number; h: number }, tx: number, ty: number, pad = 0) {
  const cx = b.px + b.w / 2, cy = b.py + b.h / 2
  const dx = tx - cx, dy = ty - cy
  if (!dx && !dy) return { x: cx, y: cy }
  const k = Math.min((b.w / 2 + pad) / Math.abs(dx || 1e-9), (b.h / 2 + pad) / Math.abs(dy || 1e-9))
  return { x: cx + dx * k, y: cy + dy * k }
}
const rels = computed(() => props.p.relations.filter((r) => byName.value.has(r.from) && byName.value.has(r.to)).map((r) => {
  const a = byName.value.get(r.from)!, b = byName.value.get(r.to)!
  const bc = { x: b.px + b.w / 2, y: b.py + b.h / 2 }, ac = { x: a.px + a.w / 2, y: a.py + a.h / 2 }
  const s = edgePoint(a, bc.x, bc.y, 1), e = edgePoint(b, ac.x, ac.y, 1)
  return { ...r, s, e, mx: (s.x + e.x) / 2, my: (s.y + e.y) / 2 }
}))
const tone = (n: string) => props.p.tones?.[n]
const dashed = (k: string) => k === 'implements' || k === 'uses' || k === 'creates'
const markerEnd = (k: string) => (k === 'inherits' || k === 'implements' ? 'url(#cl-tri)' : k === 'uses' || k === 'creates' ? 'url(#cl-open)' : undefined)
</script>

<template>
  <svg :width="layout.width" :height="layout.height" :viewBox="`0 0 ${layout.width} ${layout.height}`" :style="{ maxWidth: '100%', minWidth: Math.min(layout.width, 560) + 'px', height: 'auto' }" role="img" aria-label="class diagram">
    <defs>
      <marker id="cl-tri" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="11" markerHeight="11" orient="auto"><path d="M1 1 L11 6 L1 11 z" class="hollow" /></marker>
      <marker id="cl-open" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M1 1 L9 5 L1 9" fill="none" class="openarrow" /></marker>
      <marker id="cl-dia" viewBox="0 0 14 10" refX="13" refY="5" markerWidth="13" markerHeight="10" orient="auto-start-reverse"><path d="M1 5 L7 1 L13 5 L7 9 z" class="solid" /></marker>
    </defs>
    <g v-for="(r, i) in rels" :key="i">
      <line class="rel" :class="{ dashed: dashed(r.kind) }" :x1="r.s.x" :y1="r.s.y" :x2="r.e.x" :y2="r.e.y" :marker-end="markerEnd(r.kind)" :marker-start="r.kind === 'has' ? 'url(#cl-dia)' : undefined" />
      <text v-if="r.label || r.kind === 'creates'" class="rl" :x="r.mx" :y="r.my - 4" text-anchor="middle">{{ r.label ?? 'creates' }}</text>
    </g>
    <g v-for="b in layout.placed" :key="b.name">
      <rect class="svn box" :class="tone(b.name) ? `t-${tone(b.name)}` : ''" :x="b.px" :y="b.py" :width="b.w" :height="b.h" rx="7" />
      <text v-if="b.kind !== 'class'" class="st" :x="b.px + b.w / 2" :y="b.py + 14" text-anchor="middle">«{{ b.kind }}»</text>
      <text class="nm" :class="tone(b.name) ? `t-${tone(b.name)}` : ''" :x="b.px + b.w / 2" :y="b.py + (b.kind !== 'class' ? 30 : 20)" text-anchor="middle">{{ b.name }}</text>
      <template v-if="b.fields.length || b.methods.length">
        <line class="sep" :x1="b.px" :x2="b.px + b.w" :y1="b.py + (b.kind !== 'class' ? 38 : 28)" :y2="b.py + (b.kind !== 'class' ? 38 : 28)" />
        <text v-for="(f, k) in b.fields" :key="'f' + k" class="mem" :x="b.px + PAD" :y="b.py + (b.kind !== 'class' ? 38 : 28) + 16 + k * LINE">{{ f }}</text>
        <line v-if="b.fields.length && b.methods.length" class="sep" :x1="b.px" :x2="b.px + b.w" :y1="b.py + (b.kind !== 'class' ? 38 : 28) + 6 + b.fields.length * LINE + 4" :y2="b.py + (b.kind !== 'class' ? 38 : 28) + 6 + b.fields.length * LINE + 4" />
        <text v-for="(m, k) in b.methods" :key="'m' + k" class="mem" :x="b.px + PAD" :y="b.py + (b.kind !== 'class' ? 38 : 28) + 16 + (b.fields.length ? b.fields.length * LINE + 10 : 0) + k * LINE">{{ m }}</text>
      </template>
    </g>
  </svg>
</template>

<style scoped>
.rel { stroke: var(--ink-3); stroke-width: 1.6; }
.rel.dashed { stroke-dasharray: 5 4; }
.hollow { fill: var(--bg); stroke: var(--ink-3); stroke-width: 1.5; }
.solid { fill: var(--ink-3); stroke: var(--ink-3); }
.openarrow { stroke: var(--ink-3); stroke-width: 1.6; }
.rl { font: 500 10.5px var(--font-mono); fill: var(--ink-2); paint-order: stroke; stroke: var(--bg); stroke-width: 4px; }
.box { stroke-width: 1.6; }
.nm { font: 700 13px var(--font-ui); fill: var(--ink); }
.nm.t-focus { fill: var(--focus-fg); } .nm.t-keep { fill: var(--keep-fg); } .nm.t-hit { fill: var(--hit-fg); } .nm.t-miss { fill: var(--miss-fg); } .nm.t-dim { fill: var(--dim-fg); }
.st { font: 500 10px var(--font-mono); fill: var(--ink-3); }
.sep { stroke: var(--tile-bd); stroke-width: 1; }
.mem { font: 500 11.5px var(--font-mono); fill: var(--ink-2); }
</style>
