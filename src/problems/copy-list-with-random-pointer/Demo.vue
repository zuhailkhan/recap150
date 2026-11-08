<script setup lang="ts">
import { computed, ref } from 'vue'
import { list } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick an old node. Its twin's random pointer is the map applied to the old random pointer.
const vals = [7, 13, 11, 10, 1]
const rnd = [null, 0, 4, 2, 0] as (number | null)[]
const i = ref(2)

const target = computed(() => rnd[i.value])
const oldList = computed(() =>
  list(vals, {
    label: 'original',
    tones: vals.map((_, k) => (k === i.value ? 'focus' : k === target.value ? 'keep' : null)),
    links: target.value === null ? [] : [{ from: i.value, to: target.value }],
  }),
)
const newList = computed(() =>
  list(vals, {
    label: 'copy',
    tones: vals.map((_, k) => (k === i.value ? 'focus' : k === target.value ? 'keep' : null)),
    links: target.value === null ? [] : [{ from: i.value, to: target.value }],
  }),
)
</script>

<template>
  <div class="d">
    <label class="pick">Old node <b>{{ vals[i] }}</b> (position {{ i }})
      <input v-model.number="i" type="range" min="0" :max="vals.length - 1" step="1" aria-label="Choose an old node" />
    </label>
    <PanelView :panel="oldList" />
    <PanelView :panel="newList" />
    <p class="verdict" role="status">
      <template v-if="target === null">Old {{ vals[i] }} has random = null, so its twin gets null.</template>
      <template v-else>Old {{ vals[i] }} points random at old {{ vals[target] }}. The map says the twin of old {{ vals[target] }} is the new node at position {{ target }}, so the new {{ vals[i] }} points there. The arrow never leaves the copy.</template>
    </p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.pick { display: grid; gap: 6px; font-weight: 600; }
.pick input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
