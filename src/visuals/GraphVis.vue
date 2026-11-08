<script setup lang="ts">
import { computed } from 'vue'
import type { GraphPanel } from '@/core/panels'
const props = defineProps<{ p: GraphPanel }>()
const R = 7
const pos = computed(() => {
  const n = props.p.nodes.length
  return new Map(props.p.nodes.map((nd, i) => {
    const a = (2 * Math.PI * i) / Math.max(1, n) - Math.PI / 2
    return [nd.id, { x: nd.x ?? 50 + 38 * Math.cos(a), y: nd.y ?? 50 + 38 * Math.sin(a) }]
  }))
})
const segs = computed(() => props.p.edges.filter((e) => pos.value.has(e.from) && pos.value.has(e.to)).map((e) => {
  const a = pos.value.get(e.from)!, b = pos.value.get(e.to)!
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1
  const pad = R + (e.directed ? 1.5 : 0)
  return { e, sx: a.x + (dx / d) * R, sy: a.y + (dy / d) * R, ex: b.x - (dx / d) * pad, ey: b.y - (dy / d) * pad, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }
}))
const cls = (id: string) => { const t = props.p.tones?.[id]; return t ? `t-${t}` : '' }
</script>

<template>
  <svg class="gv" viewBox="-4 -4 108 112" role="img" aria-label="graph">
    <defs><marker id="ga" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="svarrow" /></marker></defs>
    <g v-for="(s, i) in segs" :key="i">
      <line class="sve" :class="s.e.tone ? `t-${s.e.tone}` : ''" style="stroke-width: 1.4" :x1="s.sx" :y1="s.sy" :x2="s.ex" :y2="s.ey" :marker-end="s.e.directed ? 'url(#ga)' : undefined" />
      <text v-if="s.e.weight !== undefined" class="svs" style="font-size: 4.2px" :x="s.mx" :y="s.my - 1.5">{{ s.e.weight }}</text>
    </g>
    <g v-for="nd in p.nodes" :key="nd.id">
      <circle class="svn" :class="cls(nd.id)" style="stroke-width: 1.4" :cx="pos.get(nd.id)!.x" :cy="pos.get(nd.id)!.y" :r="R" />
      <text class="svt" :class="cls(nd.id)" style="font-size: 5px" :x="pos.get(nd.id)!.x" :y="pos.get(nd.id)!.y">{{ nd.id }}</text>
      <text v-if="p.notes?.[nd.id]" class="svs" :class="cls(nd.id)" style="font-size: 4px" :x="pos.get(nd.id)!.x" :y="pos.get(nd.id)!.y + R + 5">{{ p.notes[nd.id] }}</text>
    </g>
  </svg>
</template>

<style scoped>
.gv { width: min(100%, 360px); height: auto; display: block; }
</style>
