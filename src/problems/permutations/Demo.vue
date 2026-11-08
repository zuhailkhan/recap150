<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Fill the slots one at a time. A number already in the path is blocked.
const nums = [1, 2, 3]
const path = ref<number[]>([])
const done = computed(() => path.value.length === nums.length)
const numPanel = computed(() => arr(nums, { label: 'numbers (blue = used)', tones: nums.map((x) => (path.value.includes(x) ? 'keep' : null)) }))
const pathPanel = computed(() => arr(path.value, { label: 'path (order so far)', tones: path.value.map((_, k) => (done.value ? 'hit' : k === path.value.length - 1 ? 'focus' : null)) }))
const say = computed(() => (done.value
  ? `All slots filled: ${path.value.join(' ')} is one order. Undo to try a different number in the last slot.`
  : `Slot ${path.value.length + 1} of ${nums.length}. Pick any number that is not blue.`))
</script>

<template>
  <div class="dperm">
    <div class="keys" role="group" aria-label="Pick a number for the next slot">
      <button v-for="x in nums" :key="x" class="btn" type="button" :disabled="path.includes(x)" :aria-label="`Use ${x}`" @click="path.push(x)">{{ x }}</button>
      <button class="btn quiet" type="button" :disabled="!path.length" @click="path.pop()">Undo</button>
      <button class="btn quiet" type="button" :disabled="!path.length" @click="path = []">Clear</button>
    </div>
    <PanelView :panel="numPanel" />
    <PanelView :panel="pathPanel" />
    <p class="verdict" :class="{ ok: done }" role="status">{{ say }}</p>
    <p class="muted small">Undo frees the number again. That is the used[i] = false line in the code.</p>
  </div>
</template>

<style scoped>
.dperm { display: grid; gap: 10px; }
.keys { display: flex; flex-wrap: wrap; gap: 8px; }
.keys .btn { min-width: 44px; min-height: 44px; font-family: var(--font-mono); font-size: 1.1rem; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
.verdict.ok { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
