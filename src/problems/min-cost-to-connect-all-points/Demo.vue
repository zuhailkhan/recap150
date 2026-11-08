<script setup lang="ts">
import { computed, ref } from 'vue'
import { graph, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Grow the tree one link at a time. Among all links from the tree to a point outside, the cheapest is always safe to take.
const pts = [[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]]
const dist = (a: number, b: number) => Math.abs(pts[a][0] - pts[b][0]) + Math.abs(pts[a][1] - pts[b][1])
const nodes = pts.map((p, i) => ({ id: String(i), x: 12 + (p[0] / 7) * 76, y: 88 - (p[1] / 10) * 76 }))

// Each step adds the cheapest crossing link. The order is fixed, so we can precompute it.
const order: [number, number][] = []
{
  const inside = new Set([0])
  while (inside.size < pts.length) {
    let best: [number, number, number] | null = null
    for (const a of inside) for (let b = 0; b < pts.length; b++) if (!inside.has(b) && (!best || dist(a, b) < best[2])) best = [a, b, dist(a, b)]
    order.push([best![0], best![1]])
    inside.add(best![1])
  }
}
const k = ref(0)
const view = computed(() => {
  const inside = new Set([0, ...order.slice(0, k.value).map((o) => o[1])])
  const tree = order.slice(0, k.value)
  const cross: [number, number][] = []
  for (const a of inside) for (let b = 0; b < pts.length; b++) if (!inside.has(b)) cross.push([a, b])
  const cheapest = Math.min(...cross.map(([a, b]) => dist(a, b)), Infinity)
  const edges = [
    ...tree.map(([a, b]) => ({ from: String(a), to: String(b), weight: dist(a, b), tone: 'keep' as Tone })),
    ...cross.map(([a, b]) => ({ from: String(a), to: String(b), weight: dist(a, b), tone: (dist(a, b) === cheapest ? 'hit' : undefined) as Tone | undefined })),
  ]
  const tones: Record<string, Tone> = {}
  inside.forEach((i) => (tones[String(i)] = 'keep'))
  return { panel: graph(nodes, edges, { tones, label: 'points in the tree are shaded. Numbered lines cross from the tree to the outside' }), cheapest, total: tree.reduce((s, [a, b]) => s + dist(a, b), 0), done: inside.size === pts.length }
})
</script>

<template>
  <div class="mcd">
    <PanelView :panel="view.panel" />
    <div class="row">
      <button class="btn go" :disabled="view.done" @click="k++">Take the cheapest crossing link</button>
      <button class="btn" @click="k = 0">Start over</button>
    </div>
    <p class="verdict" role="status">
      <template v-if="view.done">All 5 points are connected. Total cost {{ view.total }}.</template>
      <template v-else>Cheapest crossing link costs {{ view.cheapest }} (green). Tree cost so far: {{ view.total }}. Any other crossing link costs the same or more.</template>
    </p>
  </div>
</template>

<style scoped>
.mcd { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.btn { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.btn.go { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.btn:disabled { opacity: 0.5; cursor: default; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
