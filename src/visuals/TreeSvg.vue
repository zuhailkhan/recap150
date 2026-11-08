<script setup lang="ts">
import { computed } from 'vue'
import type { Layout } from './treeLayout'

const props = defineProps<{ layout: Layout; tone: (id: string) => string | null | undefined; ptrs?: (id: string) => string[]; hot?: (id: string) => boolean }>()
const W = 46, H = 58, R = 18, PAD = 26
const pos = computed(() => new Map(props.layout.nodes.map((n) => [n.id, { x: PAD + n.x * W, y: PAD + n.y * H }])))
const width = computed(() => PAD * 2 + Math.max(0, props.layout.cols - 1) * W)
const height = computed(() => PAD * 2 + Math.max(0, props.layout.rows - 1) * H + 18)
const cls = (id: string) => { const t = props.tone(id); return t ? `t-${t}` : '' }
</script>

<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" style="max-width: 100%; height: auto" role="img" aria-label="tree diagram">
    <line v-for="e in layout.edges" :key="e.from + '>' + e.to" class="sve" :class="props.hot?.(e.to) ? 't-focus' : ''" :x1="pos.get(e.from)!.x" :y1="pos.get(e.from)!.y" :x2="pos.get(e.to)!.x" :y2="pos.get(e.to)!.y" />
    <g v-for="n in layout.nodes" :key="n.id">
      <circle v-if="n.end" class="svn" :class="cls(n.id)" :cx="pos.get(n.id)!.x" :cy="pos.get(n.id)!.y" :r="R + 4" style="fill: none" />
      <circle class="svn" :class="cls(n.id)" :cx="pos.get(n.id)!.x" :cy="pos.get(n.id)!.y" :r="R" />
      <text class="svt" :class="cls(n.id)" :x="pos.get(n.id)!.x" :y="pos.get(n.id)!.y">{{ n.label }}</text>
      <text v-for="(p, i) in ptrs?.(n.id) ?? []" :key="p" class="svs t-focus" :x="pos.get(n.id)!.x" :y="pos.get(n.id)!.y + R + 12 + i * 11">{{ p }}</text>
    </g>
  </svg>
</template>
