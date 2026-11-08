<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// The root 3 is first in preorder. Where it sits in inorder decides how many values go left.
const pre = [3, 9, 20, 15, 7]
// One valid inorder for each possible split. In each, the values left of 3 are exactly the first n values after 3 in preorder.
const inorders = [[3, 15, 20, 9, 7], [9, 3, 15, 20, 7], [20, 9, 3, 15, 7], [15, 20, 9, 3, 7], [9, 20, 15, 7, 3]]
const left = ref(1) // number of values to the left of the root in inorder
const n = computed(() => Math.min(4, Math.max(0, Math.trunc(left.value) || 0)))
const inorder = computed(() => inorders[n.value])
const preTones = computed(() => pre.map((_, i) => (i === 0 ? 'hit' : i <= n.value ? 'keep' : 'focus')))
const inTones = computed(() => inorder.value.map((_, i) => (i === n.value ? 'hit' : i < n.value ? 'keep' : 'focus')))
</script>

<template>
  <div class="d">
    <label class="opt">Values left of 3 in inorder: {{ n }} <input v-model.number="left" type="range" min="0" max="4" step="1" aria-label="How many values are left of the root in inorder" /></label>
    <PanelView :panel="arr(inorder, { label: 'inorder (3 is the root)', tones: inTones })" />
    <PanelView :panel="arr(pre, { label: 'preorder: root, then the left part, then the right part', tones: preTones })" />
    <p class="verdict" role="status">
      The left subtree has <strong>{{ n }}</strong> value{{ n === 1 ? '' : 's' }}, so in preorder it is the <strong>{{ n }}</strong> value{{ n === 1 ? '' : 's' }} right after the root. The other <strong>{{ 4 - n }}</strong> belong to the right subtree.
    </p>
    <p class="muted small">Blue is the left part, amber the right part. The sizes match in both lists, which is why the split works.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.opt { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; min-height: 44px; font-weight: 600; }
.opt input { flex: 1; min-width: 140px; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
