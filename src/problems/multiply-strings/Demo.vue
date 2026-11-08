<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, mark } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Two numbers of 3 digits. Tap one digit in each to see which two result slots their product lands in.
const a = ref('472')
const b = ref('36')
const i = ref(0)
const j = ref(0)
const A = computed(() => (a.value.replace(/\D/g, '').slice(0, 3) || '0').split(''))
const B = computed(() => (b.value.replace(/\D/g, '').slice(0, 3) || '0').split(''))
const ii = computed(() => Math.min(i.value, A.value.length - 1))
const jj = computed(() => Math.min(j.value, B.value.length - 1))
const p = computed(() => Number(A.value[ii.value]) * Number(B.value[jj.value]))
const slots = computed(() => A.value.length + B.value.length)
const lo = computed(() => ii.value + jj.value + 1)
const resPanel = computed(() => arr(Array.from({ length: slots.value }, (_, k) => (k === lo.value ? p.value % 10 : k === lo.value - 1 ? Math.floor(p.value / 10) : '·')), { label: `result slots 0..${slots.value - 1}`, tones: mark(slots.value, { [lo.value]: 'focus', [lo.value - 1]: 'keep' }) }))
</script>

<template>
  <div class="md">
    <label class="lab">First number (up to 3 digits)
      <input v-model="a" class="txt" type="text" inputmode="numeric" maxlength="3" autocomplete="off" />
    </label>
    <label class="lab">Second number (up to 3 digits)
      <input v-model="b" class="txt" type="text" inputmode="numeric" maxlength="3" autocomplete="off" />
    </label>
    <div class="row" role="group" aria-label="Digit i of the first number">
      <button v-for="(d, k) in A" :key="k" class="btn" :aria-pressed="ii === k" :aria-label="`First number, index ${k}, digit ${d}`" @click="i = k">i={{ k }}: {{ d }}</button>
    </div>
    <div class="row" role="group" aria-label="Digit j of the second number">
      <button v-for="(d, k) in B" :key="k" class="btn" :aria-pressed="jj === k" :aria-label="`Second number, index ${k}, digit ${d}`" @click="j = k">j={{ k }}: {{ d }}</button>
    </div>
    <PanelView :panel="resPanel" />
    <p class="verdict" role="status">{{ A[ii] }} × {{ B[jj] }} = {{ p }}. Its ones digit ({{ p % 10 }}) goes to slot i+j+1 = {{ lo }}. Its tens digit ({{ Math.floor(p / 10) }}) carries into slot i+j = {{ lo - 1 }}.</p>
  </div>
</template>

<style scoped>
.md { display: grid; gap: 10px; }
.lab { display: grid; gap: 6px; font-weight: 600; }
.txt { min-height: 44px; padding: 0 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: 700 1.1rem var(--font-mono); letter-spacing: .15em; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.btn { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.btn[aria-pressed='true'] { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
