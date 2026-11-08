<script setup lang="ts">
import { computed, ref } from 'vue'
import PanelView from '@/visuals/PanelView.vue'

// Tap tokens to build an expression. The stack is replayed from scratch each time.
const tokens = ref<string[]>([])
const nums = ['2', '3', '7', '-2']
const ops = ['+', '-', '*', '/']

const run = computed(() => {
  const stack: number[] = []
  let note = ''
  for (const tk of tokens.value) {
    if (!ops.includes(tk)) { stack.push(Number(tk)); note = `${tk} is a number. Pushed.`; continue }
    if (stack.length < 2) return { stack, note: `"${tk}" needs two numbers but the stack has ${stack.length}.`, bad: true }
    const b = stack.pop() as number
    const a = stack.pop() as number
    const r = tk === '+' ? a + b : tk === '-' ? a - b : tk === '*' ? a * b : Math.trunc(a / b)
    stack.push(r)
    note = tk === '/' && a / b !== r ? `${a} / ${b} is ${a / b}. Cut toward zero: ${r}.` : `${a} ${tk} ${b} = ${r}.`
  }
  return { stack, note: note || 'Tap tokens, numbers first.', bad: false }
})
const tokenPanel = computed(() => ({ kind: 'array' as const, label: 'tokens', items: tokens.value.length ? tokens.value : ['…'] }))
const stackPanel = computed(() => ({ kind: 'stack' as const, label: 'stack', items: run.value.stack, tones: run.value.stack.map((_, i) => (i === run.value.stack.length - 1 ? ('hit' as const) : null)), empty: 'empty' }))
</script>

<template>
  <div class="rd">
    <div class="keys" role="group" aria-label="Add a token">
      <button v-for="k in [...nums, ...ops]" :key="k" type="button" class="btn" :aria-label="`Add ${k}`" @click="tokens.push(k)">{{ k }}</button>
      <button class="btn quiet" type="button" :disabled="!tokens.length" @click="tokens.pop()">Undo</button>
      <button class="btn quiet" type="button" :disabled="!tokens.length" @click="tokens = []">Clear</button>
    </div>
    <PanelView :panel="tokenPanel" />
    <PanelView :panel="stackPanel" />
    <p class="verdict" :class="{ bad: run.bad }" role="status">{{ run.note }}</p>
    <p class="muted small">Try 7, -2, / : the answer is -3, not -4.</p>
  </div>
</template>

<style scoped>
.rd { display: grid; gap: 10px; }
.keys { display: flex; flex-wrap: wrap; gap: 8px; }
.keys .btn { font-family: var(--font-mono); font-size: 1.1rem; min-width: 44px; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
