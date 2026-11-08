<script setup lang="ts">
import { readyMetas, OFFICIAL } from '@/data/problems'
import { relativeDay, useStats } from '@/recap/stats'
import HeroStage from '@/components/HeroStage.vue'

const { due, streak, last, reviewed, categories } = useStats()
</script>

<template>
  <div class="home">
    <section class="hero-sec">
      <div class="copy">
        <h1>See the idea.<br />Then keep it.</h1>
        <p class="lede">A visual explainer for each of the {{ OFFICIAL.length }} NeetCode problems, plus short daily reviews that bring the hard ones back sooner.</p>
        <div class="cta">
          <router-link class="btn primary" to="/recap">{{ due ? `Review ${due} due ${due === 1 ? 'card' : 'cards'}` : 'Start a recap' }}</router-link>
          <router-link class="btn" to="/p/two-sum">Try an explainer</router-link>
        </div>
        <p class="status muted">
          <template v-if="reviewed">You have reviewed {{ reviewed }} of {{ readyMetas.length }} cards<template v-if="streak > 1"> and kept a {{ streak }}-day streak</template>. Last review: {{ relativeDay(last) }}.</template>
          <template v-else>Nothing reviewed yet. Your first daily mix has a few new cards in it.</template>
        </p>
      </div>
      <HeroStage />
    </section>

    <section class="index" aria-labelledby="h-cats">
      <h2 id="h-cats">By category</h2>
      <ul class="rows">
        <li class="row head" aria-hidden="true"><span>Category</span><span>Progress</span><span class="num">Written</span><span class="num">Reviewed</span><span class="num">Mastered</span><span></span></li>
        <li v-for="c in categories" :key="c.name" class="row">
          <span class="name">{{ c.name }}</span>
          <span class="bar" role="img" :aria-label="`${c.reviewed} of ${c.total} reviewed, ${c.mastered} mastered`">
            <i class="rev" :style="{ width: (c.total ? (c.reviewed / c.total) * 100 : 0) + '%' }"></i>
            <i class="mas" :style="{ width: (c.total ? (c.mastered / c.total) * 100 : 0) + '%' }"></i>
          </span>
          <span class="num"><b>{{ c.ready }}</b>/{{ c.total }}</span>
          <span class="num">{{ c.reviewed }}</span>
          <span class="num">{{ c.mastered }}</span>
          <router-link v-if="c.ready" class="drill" :to="{ path: '/recap/run', query: { mode: 'category', cat: c.name } }">Drill<span class="sr-only"> {{ c.name }}</span></router-link>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.home { max-width: 1240px; display: grid; gap: 80px; }
.hero-sec { display: grid; gap: 40px; align-items: center; }
@media (min-width: 1060px) { .hero-sec { grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 64px; } }
h1 { font-size: clamp(2.8rem, 1.6rem + 5vw, 5.4rem); line-height: .96; letter-spacing: -0.05em; margin-bottom: .3em; }
.lede { font-size: 1.2rem; line-height: 1.5; max-width: 38ch; color: var(--ink-2); margin-bottom: 28px; }
.cta { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 22px; }
.cta .btn { min-height: 48px; padding: 0 22px; }
.status { margin: 0; max-width: 46ch; font-size: .95rem; }

.rows { list-style: none; margin: 18px 0 0; padding: 0; }
.row { display: grid; grid-template-columns: minmax(0, 1fr) 76px 64px; gap: 4px 16px; align-items: center; padding: 13px 0; border-top: 1px solid var(--line); }
.row:last-child { border-bottom: 1px solid var(--line); }
.row.head { display: none; font: 500 .8rem var(--font-ui); color: var(--ink-3); padding: 0 0 8px; border-top: 0; }
.name { font-weight: 600; grid-column: 1 / -1; }
.num { display: none; font: 500 .9rem var(--font-mono); font-variant-numeric: tabular-nums; text-align: right; color: var(--ink-2); }
.num b { color: var(--ink); font-weight: 700; }
.bar { position: relative; height: 8px; border-radius: 4px; background: var(--surface-2); overflow: hidden; grid-column: 1; }
.bar i { position: absolute; inset: 0 auto 0 0; display: block; border-radius: 4px; }
.rev { background: color-mix(in srgb, var(--ink) 32%, transparent); }
.mas { background: var(--ink); }
.drill { font-size: .9rem; justify-self: end; grid-column: 3; grid-row: 2; }
@media (min-width: 760px) {
  .row, .row.head { grid-template-columns: minmax(180px, 1.1fr) minmax(120px, 1.4fr) 70px 80px 84px 56px; }
  .row.head { display: grid; }
  .name { grid-column: auto; }
  .num { display: block; }
  .bar { grid-column: auto; }
  .drill { grid-column: auto; grid-row: auto; }
}
</style>
