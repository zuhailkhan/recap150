<script setup lang="ts">
import { readyMetas, OFFICIAL } from '@/data/problems'
import { relativeDay, useStats } from '@/recap/stats'

const { due, streak, last, reviewed, categories } = useStats()
</script>

<template>
  <div class="home">
    <h1>Recap150</h1>
    <p class="lede">See the idea behind each NeetCode 150 problem, then keep it fresh with short daily reviews.</p>

    <section class="stats" aria-label="Your progress">
      <div class="card stat main">
        <span class="n">{{ due }}</span>
        <span class="l">due today</span>
        <router-link class="btn primary" to="/recap">Start recap</router-link>
      </div>
      <div class="card stat"><span class="n">{{ streak }}</span><span class="l">day streak</span></div>
      <div class="card stat"><span class="n">{{ reviewed }}<small>/{{ readyMetas.length }}</small></span><span class="l">cards reviewed</span></div>
      <div class="card stat"><span class="n t">{{ relativeDay(last) }}</span><span class="l">last reviewed</span></div>
    </section>

    <p class="muted small">{{ readyMetas.length }} of {{ OFFICIAL.length }} explainers are written so far. Only finished ones appear in recap.</p>

    <h2>By category</h2>
    <ul class="cats">
      <li v-for="c in categories" :key="c.name" class="card cat">
        <div class="row"><strong>{{ c.name }}</strong><span class="muted small">{{ c.ready }}/{{ c.total }} written</span></div>
        <div class="bar" role="img" :aria-label="`${c.reviewed} of ${c.ready} written problems reviewed, ${c.mastered} mastered`">
          <span class="rev" :style="{ width: (c.total ? (c.reviewed / c.total) * 100 : 0) + '%' }"></span>
          <span class="mas" :style="{ width: (c.total ? (c.mastered / c.total) * 100 : 0) + '%' }"></span>
        </div>
        <div class="row small muted">
          <span>{{ c.reviewed }} reviewed · {{ c.mastered }} mastered</span>
          <router-link v-if="c.ready" :to="{ path: '/recap/run', query: { mode: 'category', cat: c.name } }">Drill</router-link>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.home { max-width: 1180px; }
.lede { font-size: 1.15rem; max-width: 56ch; color: var(--ink-2); }
.stats { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 24px 0 12px; }
@media (min-width: 900px) { .stats { grid-template-columns: 1.4fr 1fr 1fr 1fr; } }
.stat { display: grid; gap: 4px; align-content: start; }
.stat .n { font: 700 2.4rem/1 var(--font-head); }
.stat .n.t { font-size: 1.5rem; padding-top: 10px; }
.stat small { font-size: 1.1rem; color: var(--ink-2); }
.stat .l { color: var(--ink-2); font-size: .9rem; }
.stat.main { grid-column: 1 / -1; background: var(--accent-soft); border-color: var(--accent); justify-items: start; }
@media (min-width: 900px) { .stat.main { grid-column: auto; } }
.stat.main .btn { margin-top: 8px; }
.cats { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); }
.cat { display: grid; gap: 8px; padding: 14px; }
.row { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }
.bar { position: relative; height: 10px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.bar span { position: absolute; inset: 0 auto 0 0; }
.rev { background: var(--focus-bd); } .mas { background: var(--hit-bd); }
</style>
