<script setup lang="ts">
import { computed, ref } from 'vue'
import { RECAP } from '@/recap/config'
import { buildDaily, buildWeak } from '@/recap/scheduler'
import { candidates, relativeDay, useStats } from '@/recap/stats'
import { progress } from '@/recap/store'
import { categoryList } from '@/data/problems'

const { today, due, streak, last, categories } = useStats()
const daily = computed(() => buildDaily(candidates, progress.cards, today.value).length)
const weak = computed(() => buildWeak(candidates, progress.cards).length)
const cat = ref(categoryList.find((c) => c.ready)?.name ?? categoryList[0].name)
const readyCats = computed(() => categories.value.filter((c) => c.ready))
</script>

<template>
  <div class="rh">
    <h1>Recap</h1>
    <p class="lede">Try to recall each problem before you look. Then rate how it went. Hard ones come back sooner.</p>
    <p class="status muted">{{ due }} due today. {{ streak }}-day streak. Last review: {{ relativeDay(last) }}.</p>

    <ul class="modes">
      <li class="mode">
        <div class="txt">
          <h2>Daily mix</h2>
          <p class="muted">Cards that are due, then up to {{ RECAP.newPerDay }} new ones, at most {{ RECAP.dailyCap }} in all.</p>
        </div>
        <p class="n"><b>{{ daily }}</b> {{ daily === 1 ? 'card' : 'cards' }}</p>
        <router-link class="btn primary" :class="{ off: !daily }" :to="{ path: '/recap/run', query: { mode: 'daily' } }" :aria-disabled="!daily">Start daily mix</router-link>
      </li>
      <li class="mode">
        <div class="txt">
          <h2>Category drill</h2>
          <p class="muted">Every written problem in one category.</p>
          <label class="sel"><span class="sr-only">Category</span>
            <select v-model="cat"><option v-for="c in readyCats" :key="c.name" :value="c.name">{{ c.name }} ({{ c.ready }})</option></select>
          </label>
        </div>
        <p class="n"><b>{{ readyCats.find((c) => c.name === cat)?.ready ?? 0 }}</b> cards</p>
        <router-link class="btn primary" :to="{ path: '/recap/run', query: { mode: 'category', cat } }">Start drill</router-link>
      </li>
      <li class="mode">
        <div class="txt">
          <h2>Weak spots</h2>
          <p class="muted">Cards you have lapsed on, or that keep feeling hard. Worst first.</p>
        </div>
        <p class="n"><b>{{ weak }}</b> {{ weak === 1 ? 'card' : 'cards' }}</p>
        <router-link class="btn primary" :class="{ off: !weak }" :to="{ path: '/recap/run', query: { mode: 'weak' } }" :aria-disabled="!weak">Start weak spots</router-link>
      </li>
    </ul>

    <p class="muted small keys">During a card: <kbd>Space</kbd> shows the answer, then <kbd>1</kbd> Again, <kbd>2</kbd> Hard, <kbd>3</kbd> Good, <kbd>4</kbd> Easy.</p>
  </div>
</template>

<style scoped>
.rh { max-width: 1000px; }
.lede { font-size: 1.15rem; color: var(--ink-2); max-width: 46ch; margin-bottom: 8px; }
.status { margin: 0 0 40px; font-size: .95rem; }
.modes { list-style: none; margin: 0; padding: 0; }
.mode { display: grid; gap: 12px 24px; align-items: center; padding: 24px 0; border-top: 1px solid var(--line); grid-template-columns: minmax(0, 1fr); }
.mode:last-child { border-bottom: 1px solid var(--line); }
@media (min-width: 820px) { .mode { grid-template-columns: minmax(0, 1fr) 110px 200px; } }
.mode h2 { margin: 0 0 4px; }
.mode p { margin: 0; }
.txt p { max-width: 46ch; }
.n { font: 500 .95rem var(--font-mono); color: var(--ink-2); }
.n b { font-size: 1.5rem; color: var(--ink); font-weight: 700; }
.off { opacity: .4; pointer-events: none; }
.sel { display: block; margin-top: 10px; }
select { min-height: 44px; padding: 0 12px; font: .95rem var(--font-ui); color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: var(--radius-s); max-width: 100%; }
.keys { margin-top: 28px; }
</style>
