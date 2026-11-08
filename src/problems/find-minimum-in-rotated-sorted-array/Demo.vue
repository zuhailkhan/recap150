<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// A rotated array is two sorted runs. Everything bigger than the last item is the high run, and the minimum starts the low run.
const base = [1, 2, 3, 4, 5, 6, 7, 8]
const spin = ref(3)
const nums = computed(() => [...base.slice(base.length - spin.value), ...base.slice(0, base.length - spin.value)])
const last = computed(() => nums.value[nums.value.length - 1])
const panel = computed(() => arr(nums.value, {
  label: 'green: not bigger than the last item. marked: bigger than the last item',
  tones: nums.value.map((v, i) => (i === nums.value.length - 1 ? 'focus' : v > last.value ? 'keep' : 'hit')),
  pointers: [{ name: 'min', at: nums.value.indexOf(1), tone: 'hit' }, { name: 'last', at: nums.value.length - 1, tone: 'focus' }],
}))
</script>

<template>
  <div class="fm">
    <label class="ctl">Rotate by: <b>{{ spin }}</b> step{{ spin === 1 ? '' : 's' }}
      <input v-model.number="spin" type="range" min="0" :max="base.length - 1" step="1" />
    </label>
    <PanelView :panel="panel" />
    <p class="say" role="status">Items bigger than the last one ({{ last }}) are always on the left of the minimum. Items not bigger are on its right. So comparing the middle with the right end tells you which side the minimum is on.</p>
  </div>
</template>

<style scoped>
.fm { display: grid; gap: 10px; }
.ctl { display: grid; gap: 4px; font-weight: 600; min-height: 44px; }
.ctl input { width: 100%; min-height: 32px; accent-color: var(--accent); }
.say { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
</style>
