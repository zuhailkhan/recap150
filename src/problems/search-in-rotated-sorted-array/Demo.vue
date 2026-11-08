<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Whatever the middle is, one side of it is in order. If the target fits in that side, keep it. Otherwise keep the other side.
const nums = [4, 5, 6, 7, 0, 1, 2]
const m = ref(2)
const target = ref(1)
const l = 0
const r = nums.length - 1
const leftSorted = computed(() => nums[l] <= nums[m.value])
const found = computed(() => nums[m.value] === target.value)
const fits = computed(() => leftSorted.value ? nums[l] <= target.value && target.value < nums[m.value] : nums[m.value] < target.value && target.value <= nums[r])
const keepLeft = computed(() => leftSorted.value === fits.value)
const panel = computed(() => arr(nums, {
  label: 'marked: the ordered side. dim: the side that gets dropped',
  tones: nums.map((_, i) => (i === m.value ? (found.value ? 'hit' : 'focus') : found.value ? null : (keepLeft.value ? i > m.value : i < m.value) ? 'dim' : (leftSorted.value ? i < m.value : i > m.value) ? 'keep' : null)),
  pointers: [{ name: 'm', at: m.value, tone: 'focus' }],
}))
const text = computed(() => {
  if (found.value) return `The middle holds ${target.value}. Found.`
  const side = leftSorted.value ? 'left' : 'right'
  return `The ${side} side of m is in order. Target ${target.value} ${fits.value ? 'fits inside it, so keep that side' : 'does not fit inside it, so keep the other side'}.`
})
</script>

<template>
  <div class="sr">
    <label class="ctl">Middle at index: <b>{{ m }}</b>
      <input v-model.number="m" type="range" min="0" :max="nums.length - 1" step="1" />
    </label>
    <label class="ctl">Target:
      <select v-model.number="target"><option v-for="v in nums" :key="v" :value="v">{{ v }}</option></select>
    </label>
    <PanelView :panel="panel" />
    <p class="say" role="status">{{ text }}</p>
  </div>
</template>

<style scoped>
.sr { display: grid; gap: 10px; }
.ctl { display: grid; gap: 4px; font-weight: 600; min-height: 44px; }
.ctl input { width: 100%; min-height: 32px; accent-color: var(--accent); }
.ctl select { min-height: 44px; font: inherit; padding: 0 10px; border-radius: 8px; border: 2px solid var(--line); background: var(--surface); color: inherit; }
.say { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
</style>
