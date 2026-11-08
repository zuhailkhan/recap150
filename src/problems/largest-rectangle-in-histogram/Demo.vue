<script setup lang="ts">
import { computed, ref } from 'vue'

// Tap a bar. Its best rectangle stretches left and right until a shorter bar. That is the whole idea.
const heights = [2, 1, 5, 6, 2, 3]
const pick = ref(3)

const span = computed(() => {
  const h = heights[pick.value]
  let l = pick.value
  let r = pick.value
  while (l > 0 && heights[l - 1] >= h) l--
  while (r < heights.length - 1 && heights[r + 1] >= h) r++
  return { l, r, h, w: r - l + 1, area: h * (r - l + 1) }
})
const max = Math.max(...heights)
</script>

<template>
  <div class="hg">
    <div class="chart" role="group" aria-label="Histogram bars. Tap one.">
      <button
        v-for="(h, i) in heights"
        :key="i"
        type="button"
        class="col"
        :class="{ inside: i >= span.l && i <= span.r, chosen: i === pick }"
        :aria-label="`Bar ${i}, height ${h}`"
        :aria-pressed="i === pick"
        @click="pick = i"
      >
        <span class="bar" :style="{ height: `${(h / max) * 100}%` }"><span class="cut" :style="{ height: i >= span.l && i <= span.r ? `${(span.h / h) * 100}%` : '0%' }" /></span>
        <span class="num">{{ h }}</span>
      </button>
    </div>
    <p class="verdict" role="status">
      Bar {{ pick }} has height {{ span.h }}. Going left and right until a shorter bar, it spans bars {{ span.l }} to {{ span.r }}: width {{ span.w }}. Area {{ span.h }} x {{ span.w }} = <strong>{{ span.area }}</strong>.
    </p>
    <p class="muted small">Try every bar. The biggest area is 10, from bar 2. The stack finds each bar's limits without any scanning.</p>
  </div>
</template>

<style scoped>
.hg { display: grid; gap: 10px; }
.chart { display: flex; align-items: flex-end; gap: 6px; height: 190px; }
.col { flex: 1; min-width: 44px; max-width: 72px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: stretch; gap: 4px; padding: 0; border: 0; background: none; cursor: pointer; color: var(--ink); }
.bar { position: relative; display: flex; align-items: flex-end; border: 2px solid var(--tile-bd); border-radius: 6px 6px 0 0; background: var(--tile-bg); overflow: hidden; }
.cut { width: 100%; background: transparent; }
.col.inside .bar { border-color: var(--hit-bd); }
.col.inside .cut { background: var(--hit-bg); }
.col.chosen .bar { border-color: var(--focus-bd); border-width: 3px; }
.col.chosen .cut { background: var(--focus-bg); }
.col:focus-visible { outline: 3px solid var(--ring); outline-offset: 2px; }
.num { text-align: center; font-family: var(--font-mono); font-weight: 700; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
</style>
