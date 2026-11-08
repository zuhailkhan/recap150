<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Pick a centre. Each green window is one palindrome that this centre adds to the count.
const text = ref('aabaa')
const s = computed(() => text.value.slice(0, 16))
const pick = ref(4)
const centres = computed(() => Math.max(s.value.length * 2 - 1, 1))
const k = computed(() => Math.min(pick.value, centres.value - 1))
const c = computed(() => k.value >> 1)
const even = computed(() => (k.value & 1) === 1)
const found = computed(() => {
  const out: string[] = []
  let l = c.value
  let r = c.value + (even.value ? 1 : 0)
  while (l >= 0 && r < s.value.length && s.value[l] === s.value[r]) { out.push(s.value.slice(l, r + 1)); l--; r++ }
  return { out, l: l + 1, r: r - 1 }
})
const panel = computed(() => {
  const { l, r } = found.value
  const tones: (Tone | null)[] = s.value.split('').map((_, i) => (i >= l && i <= r ? 'hit' : null))
  return arr(s.value.split(''), { label: even.value ? `even centre between ${c.value} and ${c.value + 1}` : `odd centre on ${c.value}`, tones })
})
const total = computed(() => {
  let n = 0
  for (let i = 0; i < s.value.length; i++) for (const w of [0, 1]) {
    let l = i
    let r = i + w
    while (l >= 0 && r < s.value.length && s.value[l] === s.value[r]) { n++; l--; r++ }
  }
  return n
})
</script>

<template>
  <div class="ps">
    <label class="f">Text (up to 16 letters) <input v-model="text" type="text" maxlength="16" autocomplete="off" /></label>
    <label class="f">Centre {{ k + 1 }} of {{ centres }} <input v-model.number="pick" type="range" min="0" :max="centres - 1" /></label>
    <PanelView :panel="panel" />
    <p class="v" role="status">
      This centre counts {{ found.out.length }}<span v-if="found.out.length">: {{ found.out.join(', ') }}</span>. All centres together: {{ total }}.
    </p>
  </div>
</template>

<style scoped>
.ps { display: grid; gap: 10px; }
.f { display: grid; gap: 4px; font-weight: 600; }
.f input[type='text'] { min-height: 44px; padding: 0 10px; font: inherit; }
.f input[type='range'] { min-height: 44px; }
.v { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
