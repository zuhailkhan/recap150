<script setup lang="ts">
import { computed, ref } from 'vue'
import PanelView from '@/visuals/PanelView.vue'

// Add days one at a time. The stack is replayed from scratch, so a warmer day visibly pops colder ones.
const temps = ref<number[]>([73, 71, 69])
const next = ref(75)

const sim = computed(() => {
  const stack: number[] = []
  const answer = temps.value.map(() => 0)
  let popped: number[] = []
  temps.value.forEach((tp, i) => {
    popped = []
    while (stack.length && tp > temps.value[stack[stack.length - 1]]) {
      const j = stack.pop() as number
      answer[j] = i - j
      popped.push(j)
    }
    stack.push(i)
  })
  return { stack, answer, popped }
})
const add = () => temps.value.push(Math.round(next.value) || 0)
const tempPanel = computed(() => ({ kind: 'array' as const, label: 'temperature', items: temps.value, tones: temps.value.map((_, k) => (k === temps.value.length - 1 ? ('focus' as const) : sim.value.stack.includes(k) ? ('keep' as const) : ('dim' as const))) }))
const stackPanel = computed(() => ({ kind: 'stack' as const, label: 'waiting days (day: temp)', items: sim.value.stack.map((k) => `${k}: ${temps.value[k]}`), empty: 'empty' }))
const answerPanel = computed(() => ({ kind: 'array' as const, label: 'days to wait', items: sim.value.answer, tones: sim.value.answer.map((v, k) => (sim.value.popped.includes(k) ? ('hit' as const) : v === 0 ? null : ('dim' as const))) }))
const note = computed(() => {
  const p = sim.value.popped
  if (!temps.value.length) return 'Add a day.'
  return p.length ? `The last day is warmer than ${p.length} waiting day${p.length === 1 ? '' : 's'}. They popped and learned how long they waited.` : 'The last day is not warmer than the top of the stack, so nothing popped. It joins the stack.'
})
</script>

<template>
  <div class="dt">
    <div class="row">
      <label class="num">Next temperature <input v-model.number="next" type="number" step="1" inputmode="numeric" /></label>
      <button class="btn" type="button" @click="add">Add day</button>
      <button class="btn quiet" type="button" :disabled="!temps.length" @click="temps.pop()">Remove last</button>
    </div>
    <PanelView :panel="tempPanel" />
    <PanelView :panel="stackPanel" />
    <PanelView :panel="answerPanel" />
    <p class="verdict" role="status">{{ note }}</p>
    <p class="muted small">The stack always holds days in falling temperature order. Add 80 to clear it.</p>
  </div>
</template>

<style scoped>
.dt { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; align-items: end; gap: 8px; }
.num { display: grid; gap: 4px; font-weight: 600; }
.num input { min-height: 44px; width: 8rem; padding: 0 10px; border: 2px solid var(--line); border-radius: 10px; background: var(--tile-bg); color: var(--tile-fg); font: inherit; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
</style>
