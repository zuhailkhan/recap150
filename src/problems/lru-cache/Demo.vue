<script setup lang="ts">
import { computed, ref } from 'vue'
import { list } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Capacity 3. Newest key sits next to H. Tap a key to use it. Add a new key to fill and evict.
const CAP = 3
const order = ref<string[]>(['A', 'B', 'C'])
const next = ref(0)
const said = ref('Tap a key to use it, or add a new one.')
const names = 'DEFGHIJKLMNOPQRSTUVWXYZ'

const use = (k: string) => {
  order.value = [k, ...order.value.filter((x) => x !== k)]
  said.value = `Used ${k}: unlink it and relink it next to H. Nothing else moves.`
}
const add = () => {
  const k = names[next.value++ % names.length]
  const evicted = order.value.length >= CAP ? order.value[order.value.length - 1] : null
  order.value = [k, ...order.value].slice(0, CAP)
  said.value = evicted ? `Added ${k} at the front. Over capacity, so ${evicted} (next to T) is unlinked.` : `Added ${k} at the front.`
}
const panel = computed(() =>
  list(['H', ...order.value, 'T'], {
    label: 'newest next to H, oldest next to T',
    doubly: true,
    tones: ['dim', 'hit', ...order.value.slice(1).map(() => null), 'dim'],
    pointers: [{ name: 'newest', at: 1 }, { name: 'oldest', at: order.value.length, tone: 'miss' }],
  }),
)
</script>

<template>
  <div class="d">
    <PanelView :panel="panel" />
    <div class="row" role="group" aria-label="Use a key">
      <button v-for="k in order" :key="k" class="btn" @click="use(k)">Use {{ k }}</button>
      <button class="btn add" @click="add">Add new key</button>
    </div>
    <p class="verdict" role="status">{{ said }}</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.btn { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.btn.add { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
