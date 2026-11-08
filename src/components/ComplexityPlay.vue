<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ReadyMeta } from '@/core/schema'

const props = defineProps<{ fast: ReadyMeta['fast'] }>()
type Growth = ReadyMeta['fast']['compare']['brute']
const n = ref(20)
const k = ref(5)
const m = ref(10)
const usesK = computed(() => props.fast.vars.some((v) => v.sym === 'k'))
const usesM = computed(() => props.fast.vars.some((v) => v.sym === 'm'))
const lg = (x: number) => Math.log2(Math.max(2, x))
const cost = (g: Growth): number => ({
  "1": 1, logn: lg(n.value), n: n.value, nlogn: n.value * lg(n.value), n2: n.value ** 2, n3: n.value ** 3, "2n": 2 ** Math.min(n.value, 60),
  nk: n.value * k.value, nklogk: n.value * k.value * lg(k.value), n2k: n.value ** 2 * k.value, nm: n.value * m.value, nlogm: n.value * lg(m.value),
}[g])
const brute = computed(() => cost(props.fast.compare.brute))
const best = computed(() => cost(props.fast.compare.optimal))
const big = computed(() => Math.max(brute.value, best.value))
const logScale = computed(() => big.value / Math.max(1, Math.min(brute.value, best.value)) > 2000)
const w = (v: number) => Math.max(1.5, (logScale.value ? Math.log10(Math.max(1, v)) / Math.log10(Math.max(10, big.value)) : v / big.value) * 100)
const fmt = (v: number) => (v >= 1e9 ? v.toExponential(1).replace("e+", " × 10^") : Math.round(v).toLocaleString("en-US"))
const ratio = computed(() => Math.max(1, Math.round(brute.value / Math.max(1, best.value))))
</script>

<template>
  <div class="cp">
    <div class="sliders">
      <label>n <output>{{ n }}</output><input v-model.number="n" type="range" min="2" max="200" aria-label="n" /></label>
      <label v-if="usesM">m <output>{{ m }}</output><input v-model.number="m" type="range" min="1" max="50" aria-label="m" /></label>
      <label v-if="usesK">k <output>{{ k }}</output><input v-model.number="k" type="range" min="1" max="20" aria-label="k" /></label>
    </div>
    <p class="vars small muted"><template v-for="(v, i) in fast.vars" :key="v.sym"><code>{{ v.sym }}</code> = {{ v.meaning }}<template v-if="i < fast.vars.length - 1">. </template></template>.</p>
    <div class="bars">
      <div class="b"><div class="cap"><span>{{ fast.compare.bruteLabel }}</span><strong>{{ fmt(brute) }}</strong></div><div class="track"><span class="fill tone-miss" :style="{ width: w(brute) + '%' }"></span></div></div>
      <div class="b"><div class="cap"><span>{{ fast.compare.optimalLabel }}</span><strong>{{ fmt(best) }}</strong></div><div class="track"><span class="fill tone-hit" :style="{ width: w(best) + '%' }"></span></div></div>
    </div>
    <p class="small muted">Unit: {{ fast.compare.unit }}. At these sizes brute force does about <strong>{{ ratio }}×</strong> the work. Drag the sliders to watch the gap grow.<template v-if="logScale"> Bars use a log scale because the gap is huge.</template></p>
  </div>
</template>

<style scoped>
.cp { display: grid; gap: 14px; }
.sliders { display: flex; flex-wrap: wrap; gap: 4px 28px; }
label { display: flex; align-items: center; gap: 10px; font: 600 .95rem var(--font-mono); min-height: 44px; }
output { min-width: 2.5ch; text-align: right; }
input[type='range'] { width: 180px; max-width: 100%; accent-color: var(--ink); min-height: 44px; }
.vars { margin: 0; }
.bars { display: grid; gap: 16px; }
.cap { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: .92rem; margin-bottom: 6px; }
.cap strong { font: 600 .95rem var(--font-mono); font-variant-numeric: tabular-nums; }
.track { height: 14px; border-radius: 4px; background: var(--surface-2); overflow: hidden; }
.fill { display: block; height: 100%; border-radius: 4px; border-right: 2px solid; transition: width .2s; }
</style>
