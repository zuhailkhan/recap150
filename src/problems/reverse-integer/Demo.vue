<script setup lang="ts">
import { computed, ref } from 'vue'

// The reversed number can be bigger than any int32. The check runs on result before the last digit is added.
const text = ref('1534236469')
const LIM = 214748364n
const x = computed(() => {
  const v = Number(text.value)
  return Number.isInteger(v) && Math.abs(v) <= 2147483648 ? v : 0
})
const digits = computed(() => String(Math.abs(x.value)).split('').reverse())
const full = computed(() => BigInt((x.value < 0 ? '-' : '') + digits.value.join('')))
const fits = computed(() => full.value <= 2147483647n && full.value >= -2147483648n)
// result just before the last digit is pushed
const before = computed(() => BigInt(digits.value.slice(0, -1).join('') || '0'))
const early = computed(() => before.value > LIM)
</script>

<template>
  <div class="ri">
    <label>x <input v-model="text" inputmode="numeric" aria-label="Integer to reverse" /></label>
    <p class="digits" aria-label="x"><span class="k">x</span> {{ x }}</p>
    <p class="digits" :class="fits ? 'ok' : 'no'" aria-label="reversed"><span class="k">reversed</span> {{ full }}</p>
    <p class="verdict" :class="{ bad: !fits }" role="status">
      <template v-if="fits">Reversed is <strong>{{ full }}</strong>. It fits in 32 bits, so that is the answer.</template>
      <template v-else>Reversed is {{ full }}. That is outside -2147483648..2147483647, so the answer is <strong>0</strong>.</template>
    </p>
    <p class="small muted">
      The check works on result before the last digit: <strong>{{ before }}</strong> versus the limit 214748364.
      <template v-if="early">It is already above the limit, so the loop returns 0 before multiplying.</template>
      <template v-else>It is not above, so only the last digit can decide (7 for positives, -8 for negatives).</template>
    </p>
  </div>
</template>

<style scoped>
.ri { display: grid; gap: 12px; }
label { display: flex; align-items: center; gap: 8px; font-weight: 600; }
input { flex: 1; min-width: 0; max-width: 220px; min-height: 44px; padding: 0 10px; font: 600 1rem var(--font-mono); color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: 10px; }
.digits { margin: 0; display: flex; align-items: baseline; gap: 10px; font: 700 1.25rem var(--font-mono); letter-spacing: .08em; word-break: break-all; }
.k { min-width: 5.5em; font: 600 .8rem var(--font-mono); letter-spacing: 0; color: var(--ink-2); }
.digits.ok { color: var(--hit-fg); }
.digits.no { color: var(--miss-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
.verdict.bad { background: var(--miss-bg); color: var(--miss-fg); border-color: var(--miss-bd); }
</style>
