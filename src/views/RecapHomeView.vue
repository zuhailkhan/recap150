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
    <p class="muted">Try to recall each problem before you look. Then rate how it went. Hard ones come back sooner.</p>

    <div class="stats">
      <span class="chip">{{ due }} due</span><span class="chip">{{ streak }} day streak</span><span class="chip">last reviewed {{ relativeDay(last) }}</span>
    </div>

    <div class="modes">
      <section class="card mode">
        <h2>Daily mix</h2>
        <p>Cards that are due, then up to {{ RECAP.newPerDay }} new ones. At most {{ RECAP.dailyCap }} cards.</p>
        <p class="n">{{ daily }} card{{ daily === 1 ? '' : 's' }} today</p>
        <router-link class="btn primary" :class="{ off: !daily }" :to="{ path: '/recap/run', query: { mode: 'daily' } }" :aria-disabled="!daily">Start daily mix</router-link>
      </section>

      <section class="card mode">
        <h2>Category drill</h2>
        <p>Go through every written problem in one category.</p>
        <label class="sel">Category
          <select v-model="cat"><option v-for="c in readyCats" :key="c.name" :value="c.name">{{ c.name }} ({{ c.ready }})</option></select>
        </label>
        <router-link class="btn primary" :to="{ path: '/recap/run', query: { mode: 'category', cat } }">Start drill</router-link>
      </section>

      <section class="card mode">
        <h2>Weak spots</h2>
        <p>Cards you have lapsed on, or that keep feeling hard. Worst first.</p>
        <p class="n">{{ weak }} card{{ weak === 1 ? '' : 's' }}</p>
        <router-link class="btn primary" :class="{ off: !weak }" :to="{ path: '/recap/run', query: { mode: 'weak' } }" :aria-disabled="!weak">Start weak spots</router-link>
      </section>
    </div>

    <p class="muted small keys">Keys during a card: <kbd>Space</kbd> shows the answer, then <kbd>1</kbd> Again, <kbd>2</kbd> Hard, <kbd>3</kbd> Good, <kbd>4</kbd> Easy.</p>
  </div>
</template>

<style scoped>
.rh { max-width: 1100px; }
.stats { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 20px; }
.modes { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); }
.mode { display: grid; gap: 10px; align-content: start; }
.mode h2 { margin: 0; } .mode p { margin: 0; }
.n { font-weight: 700; }
.off { opacity: .45; pointer-events: none; }
.sel { display: grid; gap: 4px; font-size: .88rem; color: var(--ink-2); }
select { min-height: 44px; padding: 0 10px; font: 1rem var(--font-body); color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: 10px; }
.keys { margin-top: 20px; }
</style>
