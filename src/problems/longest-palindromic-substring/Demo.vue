<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick a centre and watch the window grow while the two ends match.
const text = ref('xabbay')
const s = computed(() => text.value.slice(0, 16))
const pick = ref(5)
const centres = computed(() => Math.max(s.value.length * 2 - 1, 1))
const k = computed(() => Math.min(pick.value, centres.value - 1))
const c = computed(() => k.value >> 1)
const even = computed(() => (k.value & 1) === 1)
const span = computed(() => {
  let l = c.value
  let r = c.value + (even.value ? 1 : 0)
  while (l >= 0 && r < s.value.length && s.value[l] === s.value[r]) { l--; r++ }
  return { l: l + 1, r: r - 1, stopL: l, stopR: r }
})
const panel = computed(() => {
  const { l, r, stopL, stopR } = span.value
  const tones: (Tone | null)[] = s.value.split('').map((_, i) => (i >= l && i <= r ? 'hit' : i === stopL || i === stopR ? 'miss' : null))
  return arr(s.value.split(''), { label: even.value ? `even centre between ${c.value} and ${c.value + 1}` : `odd centre on ${c.value}`, tones })
})
const verdict = computed(() => {
  const { l, r } = span.value
  const size = r - l + 1
  if (size <= 0) return 'Nothing grows here. The two letters next to this gap differ.'
  return `Longest palindrome at this centre: "${s.value.slice(l, r + 1)}" (length ${size}). Red letters are where the growth stopped.`
})
</script>

<template>
  <div class="lp">
    <label class="f">Text (up to 16 letters) <input v-model="text" type="text" maxlength="16" autocomplete="off" /></label>
    <label class="f">Centre {{ k + 1 }} of {{ centres }} <input v-model.number="pick" type="range" min="0" :max="centres - 1" /></label>
    <PanelView :panel="panel" />
    <p class="v" role="status">{{ verdict }}</p>
  </div>
</template>

<style scoped>
.lp { display: grid; gap: 10px; }
.f { display: grid; gap: 4px; font-weight: 600; }
.f input[type='text'] { min-height: 44px; padding: 0 10px; font: inherit; }
.f input[type='range'] { min-height: 44px; }
.v { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
