<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// You think of a number from 1 to 16. The widget always guesses the middle of what is left.
const nums = Array.from({ length: 16 }, (_, i) => i + 1)
const l = ref(0)
const r = ref(nums.length - 1)
const guesses = ref(0)
const done = ref(false)
const m = computed(() => l.value + Math.floor((r.value - l.value) / 2))
const empty = computed(() => l.value > r.value)
const panel = computed(() => arr(nums, {
  label: 'numbers still possible',
  tones: nums.map((_, i) => (done.value && i === m.value ? 'hit' : i < l.value || i > r.value ? 'dim' : i === m.value ? 'focus' : null)),
  pointers: empty.value ? [] : [{ name: 'guess', at: m.value, tone: done.value ? 'hit' : 'focus' }],
  window: empty.value ? undefined : [l.value, r.value],
}))
function answer(kind: 'higher' | 'lower' | 'got') {
  guesses.value++
  if (kind === 'got') done.value = true
  else if (kind === 'higher') l.value = m.value + 1
  else r.value = m.value - 1
}
function reset() { l.value = 0; r.value = nums.length - 1; guesses.value = 0; done.value = false }
</script>

<template>
  <div class="bs">
    <p class="muted small">Think of any number from 1 to 16. Answer honestly. The guess is always the middle of what is left.</p>
    <PanelView :panel="panel" />
    <p v-if="done" class="say hit" role="status">Found in {{ guesses }} guesses. Even 1,000,000 numbers need only about 20.</p>
    <p v-else-if="empty" class="say" role="status">No number is left. One of your answers was inconsistent.</p>
    <p v-else class="say" role="status">Is it {{ nums[m] }}? {{ r - l + 1 }} numbers still possible.</p>
    <div class="row">
      <button class="btn" type="button" :disabled="done || empty" @click="answer('higher')">Higher</button>
      <button class="btn" type="button" :disabled="done || empty" @click="answer('lower')">Lower</button>
      <button class="btn" type="button" :disabled="done || empty" @click="answer('got')">Yes, that is it</button>
      <button class="btn quiet" type="button" @click="reset">Start over</button>
    </div>
  </div>
</template>

<style scoped>
.bs { display: grid; gap: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.say { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
.say.hit { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
