<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { HldMeta } from '@/core/designSchema'
import { evalExpr, formatNum } from '@/core/expr'

type Input = HldMeta['estimate']['inputs'][number]
const props = defineProps<{ estimate: HldMeta['estimate'] }>()
const values = reactive<Record<string, number>>(Object.fromEntries(props.estimate.inputs.map((i) => [i.id, i.value])))

/** Inputs that span orders of magnitude use a log slider, so every part of the range is reachable. */
const toPos = (i: Input) => (i.log ? Math.round((Math.log(values[i.id] / i.min) / Math.log(i.max / i.min)) * 1000) : values[i.id])
function setFromPos(i: Input, pos: number) {
  if (!i.log) { values[i.id] = pos; return }
  const raw = i.min * (i.max / i.min) ** (pos / 1000)
  const mag = 10 ** Math.floor(Math.log10(raw)) / 10 // two significant digits
  values[i.id] = Math.min(i.max, Math.max(i.min, Math.round(raw / mag) * mag))
}
const onInput = (i: Input, e: Event) => setFromPos(i, Number((e.target as HTMLInputElement).value))

/** Outputs may use inputs and the outputs defined before them. */
const results = computed(() => {
  const vars: Record<string, number> = { ...values }
  return props.estimate.outputs.map((o) => {
    let v = NaN
    try { v = evalExpr(o.expr, vars) } catch { v = NaN }
    vars[o.id] = v
    return { ...o, value: v }
  })
})
const fmt = (n: number) => formatNum(n)
const reset = () => props.estimate.inputs.forEach((i) => (values[i.id] = i.value))
const changed = computed(() => props.estimate.inputs.some((i) => values[i.id] !== i.value))
</script>

<template>
  <div class="est">
    <p v-if="estimate.note" class="muted small note">{{ estimate.note }}</p>
    <div class="cols">
      <div class="ins">
        <h3 class="h">Assumptions</h3>
        <div v-for="i in estimate.inputs" :key="i.id" class="in">
          <label :for="`est-${i.id}`">{{ i.label }}</label>
          <div class="ctl">
            <input :id="`est-${i.id}`" type="range" :min="i.log ? 0 : i.min" :max="i.log ? 1000 : i.max" :step="i.log ? 1 : (i.step ?? 1)" :value="toPos(i)" @input="onInput(i, $event)" />
            <output class="val">{{ fmt(values[i.id]) }}<span v-if="i.unit" class="u">{{ i.unit }}</span></output>
          </div>
        </div>
        <button v-if="changed" type="button" class="btn sm quiet" @click="reset">Reset assumptions</button>
      </div>
      <div class="outs">
        <h3 class="h">What that means</h3>
        <dl>
          <div v-for="o in results" :key="o.id" class="out">
            <dt>{{ o.label }}<span v-if="o.note" class="n muted small">{{ o.note }}</span></dt>
            <dd><b>{{ fmt(o.value) }}</b><span class="u">{{ o.unit }}</span></dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>

<style scoped>
.est { min-width: 0; }
.note { margin: 0 0 14px; max-width: 70ch; }
.cols { display: grid; gap: 28px; }
@media (min-width: 900px) { .cols { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 48px; } }
.h { margin: 0 0 8px; font-size: .95rem; color: var(--ink-2); font-weight: 600; }
.in { padding: 6px 0 4px; border-top: 1px solid var(--line); }
.in label { font-size: .92rem; }
.ctl { display: flex; align-items: center; gap: 14px; }
input[type='range'] { flex: 1; min-width: 0; min-height: 44px; accent-color: var(--ink); }
.val { font: 600 .95rem var(--font-mono); min-width: 9ch; text-align: right; font-variant-numeric: tabular-nums; }
.u { font: 500 .78rem var(--font-mono); color: var(--ink-2); margin-left: .4em; }
dl { margin: 0; }
.out { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: 4px 16px; padding: 12px 0; border-top: 1px solid var(--line); }
.out:last-child { border-bottom: 1px solid var(--line); }
dt { font-size: .95rem; min-width: 0; }
dt .n { display: block; margin-top: 2px; }
dd { margin: 0; text-align: right; font-family: var(--font-mono); white-space: nowrap; }
dd b { font-size: 1.35rem; font-weight: 700; font-variant-numeric: tabular-nums; }
</style>
