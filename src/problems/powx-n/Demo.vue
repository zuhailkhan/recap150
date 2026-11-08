<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, bits, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick a base and a power from 0 to 31. Only the squares matching a 1 bit of the power are multiplied in.
const base = ref(2)
const n = ref(13)
const squares = computed(() => [0, 1, 2, 3, 4].map((i) => base.value ** (2 ** i)))
const used = computed(() => [0, 1, 2, 3, 4].map((i) => ((n.value >> i) & 1) === 1))
const bitPanel = computed(() => bits([{ label: 'n', value: n.value, tones: [...used.value].reverse().map((u): Tone | null => (u ? 'hit' : null)) }], { width: 5, label: 'binary digits of n' }))
const sqPanel = computed(() => arr(squares.value, { label: `x, x², x⁴, x⁸, x¹⁶ with x = ${base.value}`, tones: used.value.map((u): Tone => (u ? 'hit' : 'dim')) }))
const factors = computed(() => squares.value.filter((_, i) => used.value[i]))
const said = computed(() => (n.value === 0 ? 'n = 0: no bits set, nothing to multiply. The answer is 1.' : `${base.value}^${n.value} = ${factors.value.join(' × ')} = ${base.value ** n.value}. That is ${factors.value.length - 1} multiplication${factors.value.length === 2 ? '' : 's'} plus 4 squarings, not ${n.value - 1}.`))
</script>

<template>
  <div class="pw">
    <div class="row" role="group" aria-label="Base">
      <button v-for="b in [2, 3]" :key="b" class="btn" :aria-pressed="base === b" @click="base = b">x = {{ b }}</button>
    </div>
    <label class="lab">Power n: {{ n }}
      <input v-model.number="n" class="range" type="range" min="0" max="31" step="1" />
    </label>
    <PanelView :panel="bitPanel" />
    <PanelView :panel="sqPanel" />
    <p class="verdict" role="status">{{ said }}</p>
  </div>
</template>

<style scoped>
.pw { display: grid; gap: 10px; }
.row { display: flex; gap: 8px; }
.lab { display: grid; gap: 6px; font-weight: 600; }
.range { width: 100%; min-height: 44px; accent-color: var(--focus-bd); }
.btn { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.btn[aria-pressed='true'] { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
