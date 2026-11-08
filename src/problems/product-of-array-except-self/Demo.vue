<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick an index. The answer there is (product on its left) x (product on its right).
const nums = [2, 3, 4, 5]
const at = ref(1)
const left = computed(() => nums.slice(0, at.value).reduce((a, b) => a * b, 1))
const right = computed(() => nums.slice(at.value + 1).reduce((a, b) => a * b, 1))
const panel = computed(() => arr(nums, { label: 'nums', tones: nums.map((_, i) => (i < at.value ? 'keep' : i === at.value ? 'miss' : 'hit')), pointers: [{ name: 'i', at: at.value }] }))
</script>

<template>
  <div class="pxd">
    <label class="fld">Index i: <strong>{{ at }}</strong>
      <input v-model.number="at" type="range" min="0" :max="nums.length - 1" aria-label="Index i" />
    </label>
    <PanelView :panel="panel" />
    <p class="verdict" role="status">
      Left of i multiplies to <strong>{{ left }}</strong>. Right of i multiplies to <strong>{{ right }}</strong>.
      Answer for index {{ at }}: {{ left }} × {{ right }} = <strong>{{ left * right }}</strong>. The number {{ nums[at] }} itself is skipped.
    </p>
    <p class="muted small">Drag the slider. Left numbers, right numbers and the skipped number are shaded differently.</p>
  </div>
</template>

<style scoped>
.pxd { display: grid; gap: 10px; }
.fld { display: grid; gap: 6px; font-weight: 600; }
.fld input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
</style>
