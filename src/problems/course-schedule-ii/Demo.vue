<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, graph } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Write courses down yourself. A course is allowed only when everything it needs is already written.
const needs: number[][] = [[], [0], [0], [1, 2]]
const order = ref<number[]>([])
const nodes = [{ id: '0', x: 12, y: 50 }, { id: '1', x: 45, y: 18 }, { id: '2', x: 45, y: 82 }, { id: '3', x: 88, y: 50 }]
const ready = (c: number) => !order.value.includes(c) && needs[c].every((p) => order.value.includes(p))
const edges = needs.flatMap((ps, c) => ps.map((p) => ({ from: String(p), to: String(c), directed: true })))
const gp = computed(() => graph(nodes, edges, { label: 'arrow = must come first', tones: Object.fromEntries([0, 1, 2, 3].map((c) => [String(c), order.value.includes(c) ? 'hit' : ready(c) ? 'focus' : 'dim'])) }))
const ap = computed(() => arr(order.value, { label: 'order written so far', tones: order.value.map(() => 'hit') }))
const add = (c: number) => { if (ready(c)) order.value = [...order.value, c] }
</script>

<template>
  <div class="cod">
    <PanelView :panel="gp" />
    <PanelView :panel="ap" />
    <div class="btns" role="group" aria-label="Courses to write down">
      <button v-for="c in 4" :key="c" type="button" :disabled="!ready(c - 1)" @click="add(c - 1)">Write {{ c - 1 }}</button>
      <button type="button" class="reset" @click="order = []">Reset</button>
    </div>
    <p class="muted small" role="status">
      Lit courses (focus) are allowed now. Grey ones still wait for a prerequisite. Any order you finish with is valid, and the real algorithm gets there by walking to the needs first.
    </p>
  </div>
</template>

<style scoped>
.cod { display: grid; gap: 10px; }
.btns { display: flex; flex-wrap: wrap; gap: 8px; }
.btns button { min-height: 44px; min-width: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); font-weight: 700; cursor: pointer; }
.btns button:disabled { opacity: 0.45; cursor: not-allowed; border-color: var(--line); }
.btns .reset { border-color: var(--line); background: transparent; color: inherit; }
</style>
