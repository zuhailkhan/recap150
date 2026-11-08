<script setup lang="ts">
import { computed, ref } from 'vue'
import { list } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Type two numbers. The lists hold their digits ones-first, so column addition walks the lists left to right.
const a = ref('342')
const b = ref('465')
const digits = (s: string): number[] => [...s.replace(/\D/g, '').slice(0, 6)].map(Number).reverse()
const da = computed(() => digits(a.value))
const db = computed(() => digits(b.value))
const columns = computed(() => {
  const rows: { x: number; y: number; carryIn: number; sum: number }[] = []
  let carry = 0
  for (let i = 0; i < Math.max(da.value.length, db.value.length) || carry; i++) {
    const x = da.value[i] ?? 0
    const y = db.value[i] ?? 0
    const sum = x + y + carry
    rows.push({ x, y, carryIn: carry, sum })
    carry = Math.floor(sum / 10)
  }
  return rows
})
const result = computed(() => columns.value.map((r) => r.sum % 10))
const pa = computed(() => list(da.value, { label: 'l1 (ones digit first)' }))
const pb = computed(() => list(db.value, { label: 'l2 (ones digit first)' }))
const pr = computed(() => list(result.value, { label: 'answer list', tones: result.value.map(() => 'hit') }))
</script>

<template>
  <div class="d">
    <label class="fld">First number <input v-model="a" inputmode="numeric" maxlength="6" aria-label="First number" /></label>
    <label class="fld">Second number <input v-model="b" inputmode="numeric" maxlength="6" aria-label="Second number" /></label>
    <PanelView :panel="pa" />
    <PanelView :panel="pb" />
    <table class="cols">
      <thead><tr><th>column</th><th>digit + digit + carry</th><th>keep</th></tr></thead>
      <tbody>
        <tr v-for="(r, i) in columns" :key="i">
          <td>{{ i + 1 }}</td>
          <td>{{ r.x }} + {{ r.y }} + {{ r.carryIn }} = {{ r.sum }}</td>
          <td><b>{{ r.sum % 10 }}</b><span v-if="r.sum >= 10"> carry 1</span></td>
        </tr>
      </tbody>
    </table>
    <PanelView :panel="pr" />
    <p class="muted small">Same as adding on paper from the right. The list order already puts the ones digit first.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.fld { display: flex; align-items: center; gap: 10px; min-height: 44px; font-weight: 600; flex-wrap: wrap; }
.fld input { min-height: 44px; width: 9ch; padding: 0 10px; font: inherit; }
.cols { border-collapse: collapse; width: 100%; font-variant-numeric: tabular-nums; }
.cols th, .cols td { text-align: left; padding: 4px 8px; border-bottom: 1px solid var(--hit-bd); }
</style>
