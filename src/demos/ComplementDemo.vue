<script setup lang="ts">
import { computed, ref } from 'vue'
import Tile from '@/visuals/Tile.vue'

const nums = [2, 7, 11, 15]
const target = ref(9)
const picked = ref(0)
const need = computed(() => target.value - nums[picked.value])
const partner = computed(() => nums.findIndex((x, i) => x === need.value && i !== picked.value))
const tone = (i: number) => (i === picked.value ? 'focus' : i === partner.value ? 'hit' : null)
</script>

<template>
  <div class="cd">
    <label class="tg">Target <input v-model.number="target" type="number" step="1" min="-99" max="99" aria-label="Target" /></label>
    <div class="row" role="group" aria-label="Pick a number">
      <button v-for="(x, i) in nums" :key="i" type="button" class="pick" :aria-pressed="i === picked" :aria-label="`Pick ${x}`" @click="picked = i">
        <Tile :value="x" :tone="tone(i)" /><span class="idx">{{ i }}</span>
      </button>
    </div>
    <p class="verdict" :class="partner >= 0 ? 'ok' : 'no'" role="status">
      I picked <strong>{{ nums[picked] }}</strong>. I need <strong>{{ target }} − {{ nums[picked] }} = {{ need }}</strong>.
      <template v-if="partner >= 0">It is in the list at index {{ partner }}. Pair found.</template>
      <template v-else>{{ need }} is not in the list. No pair with this number.</template>
    </p>
    <p class="muted small">Tap a number, or change the target. Looking for the partner is the whole trick.</p>
  </div>
</template>

<style scoped>
.cd { display: grid; gap: 12px; }
.tg { display: flex; align-items: center; gap: 10px; font-weight: 600; }
input { width: 90px; min-height: 44px; padding: 0 10px; font: 600 1rem var(--font-mono); color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: 10px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.pick { display: flex; flex-direction: column; align-items: center; gap: 2px; background: none; border: 0; padding: 4px; cursor: pointer; border-radius: 12px; min-width: 44px; min-height: 44px; }
.idx { font: 500 .72rem var(--font-mono); color: var(--ink-2); }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid; }
.ok { background: var(--hit-bg); color: var(--hit-fg); border-color: var(--hit-bd); }
.no { background: var(--surface-2); color: var(--ink); border-color: var(--line); }
</style>
