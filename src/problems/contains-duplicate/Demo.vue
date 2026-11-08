<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Slide through a fixed list. The set only ever holds numbers already passed.
const nums = [4, 7, 1, 7, 9]
const read = ref(2)
const dupAt = nums.findIndex((x, i) => nums.indexOf(x) !== i)
const seen = computed(() => [...new Set(nums.slice(0, read.value))])
const stopped = computed(() => dupAt >= 0 && read.value > dupAt)
const view = computed(() => arr(nums, { label: 'nums', tones: nums.map((_, i) => (i === dupAt && stopped.value ? 'miss' : i < read.value ? 'dim' : null)) }))
const setView = computed(() => arr(seen.value, { label: 'seen', tones: seen.value.map(() => 'keep' as const) }))
</script>

<template>
  <div class="cdd">
    <label class="rd">Numbers read: <strong>{{ read }}</strong>
      <input v-model.number="read" type="range" min="0" :max="nums.length" aria-label="How many numbers have been read" />
    </label>
    <PanelView :panel="view" />
    <PanelView :panel="setView" />
    <p class="verdict" :class="{ bad: stopped }" role="status">
      <template v-if="stopped">The second 7 finds a 7 in the set. Repeat found, stop here.</template>
      <template v-else>The set has {{ seen.length }} number{{ seen.length === 1 ? '' : 's' }}. The next one is checked against it in one step.</template>
    </p>
    <p class="muted small">Drag the slider. The set never needs to look at the list again.</p>
  </div>
</template>

<style scoped>
.cdd { display: grid; gap: 10px; }
.rd { display: grid; gap: 6px; font-weight: 600; }
.rd input { width: 100%; min-height: 44px; accent-color: var(--accent); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: var(--ink); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
