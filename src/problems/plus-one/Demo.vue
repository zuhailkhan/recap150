<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Type up to 8 digits. Watch where the carry stops.
const text = ref('1299')
const digits = computed(() => text.value.replace(/\D/g, '').slice(0, 8).split('').map(Number))
const result = computed(() => {
  const out = [...digits.value]
  let stop = -1
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i] < 9) { out[i]++; stop = i; break }
    out[i] = 0
  }
  return stop === -1 ? { out: [1, ...out], stop: 0, grew: true } : { out, stop, grew: false }
})
const beforeTones = computed(() => digits.value.map((_, i): Tone | null => (i >= (result.value.grew ? 0 : result.value.stop) ? 'focus' : null)))
const afterTones = computed(() => result.value.out.map((_, i): Tone | null => (i === result.value.stop ? 'hit' : i > result.value.stop ? 'keep' : null)))
const said = computed(() =>
  digits.value.length === 0 ? 'Type at least one digit.'
    : result.value.grew ? 'Every digit was 9. Each became 0 and the carry fell off the left end, so a new leading 1 is added. The array grows.'
      : `The carry travelled left through ${digits.value.length - 1 - result.value.stop} nine${digits.value.length - 1 - result.value.stop === 1 ? '' : 's'} (now 0, kept) and stopped at index ${result.value.stop}, which went up by one.`)
</script>

<template>
  <div class="pd">
    <label class="lab">Digits (0 to 9, up to 8)
      <input v-model="text" class="txt" type="text" inputmode="numeric" maxlength="8" autocomplete="off" />
    </label>
    <PanelView :panel="arr(digits, { label: 'before', tones: beforeTones })" />
    <PanelView :panel="arr(result.out, { label: 'after: hit = the digit that absorbed the carry, keep = nines turned to 0', tones: afterTones })" />
    <p class="verdict" role="status">{{ said }}</p>
  </div>
</template>

<style scoped>
.pd { display: grid; gap: 10px; }
.lab { display: grid; gap: 6px; font-weight: 600; }
.txt { min-height: 44px; padding: 0 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: 700 1.1rem var(--font-mono); letter-spacing: .15em; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
</style>
