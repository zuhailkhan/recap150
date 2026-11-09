<script setup lang="ts">
import { computed } from 'vue'
import { readyMetas, OFFICIAL } from '@/data/problems'
import { CATALOG, trackGroups } from '@/data/design'
import { DECKS, relativeDay, useStats, useTotalDue } from '@/recap/stats'
import HeroStage from '@/components/HeroStage.vue'

const dsa = useStats('dsa')
const lld = useStats('lld')
const hld = useStats('hld')
const totalDue = useTotalDue()
const reviewed = computed(() => dsa.reviewed.value + lld.reviewed.value + hld.reviewed.value)
const totalCards = computed(() => dsa.cands.value.length + lld.cands.value.length + hld.cands.value.length)
const streak = dsa.streak
const last = dsa.last
const categories = dsa.categories

// the two design tracks, introduced as entries of their own
const tracks = computed(() => (['lld', 'hld'] as const).map((t) => {
  const entries = CATALOG.filter((c) => c.track === t)
  const groups = trackGroups(t)
  const firstReady = groups.flatMap((g) => g.entries).find((e) => e.status === 'ready')
  const products = groups.find((g) => g.name === (t === 'lld' ? 'Big products' : 'Ride, food and marketplaces'))
  return {
    id: t,
    title: t === 'lld' ? 'Low-level design' : 'High-level design',
    blurb: t === 'lld'
      ? 'Turn a vague brief into classes, and see why. Real TypeScript and Go, and a stepper that runs actual scenarios through the code.'
      : 'Start from requirements and numbers, then grow the architecture one forced step at a time. Live estimators, no code.',
    total: entries.length,
    written: groups.reduce((n, g) => n + g.ready, 0),
    sample: entries.filter((e) => (t === 'lld' ? e.group === 'Big products' : ['Uber (Ride Hailing)', 'Zomato (Food Delivery)', 'Instagram', 'WhatsApp (Chat System)', 'Netflix'].includes(e.title))).slice(0, 5).map((e) => e.title),
    start: firstReady ? `/${t}/${firstReady.slug}` : `/${t}/${entries[0].slug}`,
    products: products?.name,
  }
}))
</script>

<template>
  <div class="home">
    <section class="hero-sec">
      <div class="copy">
        <h1>Watch it run.<br />Know why it works.</h1>
        <p class="lede">Every one of the {{ OFFICIAL.length }} NeetCode problems, stepped through on the real code, plus the low-level and high-level design questions that come after. A few minutes of review a day brings the shaky ones back before you forget them.</p>
        <div class="cta">
          <router-link class="btn primary" to="/recap">{{ totalDue ? `Review ${totalDue} due ${totalDue === 1 ? 'card' : 'cards'}` : 'Start a recap' }}</router-link>
          <router-link class="btn" to="/p/two-sum">Try an explainer</router-link>
        </div>
        <p class="status muted">
          <template v-if="reviewed">You have reviewed {{ reviewed }} of {{ totalCards }} cards<template v-if="streak > 1"> and kept a {{ streak }}-day streak</template>. Last review: {{ relativeDay(last) }}.</template>
          <template v-else>Nothing reviewed yet. Your first daily mix has a few new cards in it.</template>
        </p>
      </div>
      <HeroStage />
    </section>

    <section class="tracks" aria-labelledby="h-tracks">
      <h2 id="h-tracks">Three tracks</h2>
      <ul class="trk">
        <li>
          <h3>Algorithms</h3>
          <p class="muted">The NeetCode 150, each with an idea, a step-by-step run of the real code, and pseudocode, TypeScript and Go.</p>
          <p class="n"><b>{{ readyMetas.length }}</b> of {{ OFFICIAL.length }} written</p>
          <router-link class="btn" to="/p/two-sum">Open Algorithms</router-link>
        </li>
        <li v-for="t in tracks" :key="t.id">
          <h3>{{ t.title }}</h3>
          <p class="muted">{{ t.blurb }}</p>
          <p class="sample small muted">{{ t.sample.join(', ') }} and more.</p>
          <p class="n"><b>{{ t.written }}</b> of {{ t.total }} written</p>
          <router-link class="btn" :to="t.start">Open {{ t.title }}</router-link>
        </li>
      </ul>
    </section>

    <section class="index" aria-labelledby="h-cats">
      <h2 id="h-cats">Algorithms by category</h2>
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
          <router-link v-if="c.ready" class="drill" :to="{ path: '/recap/run', query: { deck: 'dsa', mode: 'category', cat: c.name } }">Drill<span class="sr-only"> {{ c.name }}</span></router-link>
        </li>
      </ul>
      <p class="muted small decks">Review decks: <template v-for="(d, i) in DECKS" :key="d.id"><router-link :to="{ path: '/recap', query: { deck: d.id } }">{{ d.long }}</router-link><template v-if="i < DECKS.length - 1">, </template></template>.</p>
    </section>
  </div>
</template>

<style scoped>
.home { display: grid; gap: 80px; }
.hero-sec { display: grid; gap: 40px; align-items: center; }
@media (min-width: 1060px) { .hero-sec { grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 64px; min-height: max(620px, calc(100dvh - 140px)); } }
h1 { font-size: clamp(2.8rem, 1.6rem + 5vw, 5.4rem); line-height: .96; letter-spacing: -0.05em; margin-bottom: .3em; }
.lede { font-size: 1.2rem; line-height: 1.5; max-width: 40ch; color: var(--ink-2); margin-bottom: 28px; }
.cta { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 22px; }
.cta .btn { min-height: 48px; padding: 0 22px; }
.status { margin: 0; max-width: 46ch; font-size: .95rem; }

.trk { list-style: none; margin: 18px 0 0; padding: 0; display: grid; gap: 0; }
.trk li { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 22px 0; border-top: 1px solid var(--line); }
.trk li:last-child { border-bottom: 1px solid var(--line); }
@media (min-width: 900px) { .trk { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 40px; } .trk li { border-bottom: 1px solid var(--line); } }
.trk h3 { margin: 0; font-size: 1.3rem; letter-spacing: -0.02em; }
.trk p { margin: 0; max-width: 40ch; }
.n { font: 500 .9rem var(--font-mono); color: var(--ink-2); } .n b { color: var(--ink); font-size: 1.2rem; }
.trk .btn { margin-top: auto; }
.trk .n { margin-bottom: 6px; }

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
.decks { margin: 18px 0 0; }
@media (min-width: 760px) {
  .row, .row.head { grid-template-columns: minmax(180px, 1.1fr) minmax(120px, 1.4fr) 70px 80px 84px 56px; }
  .row.head { display: grid; }
  .name { grid-column: auto; }
  .num { display: block; }
  .bar { grid-column: auto; }
  .drill { grid-column: auto; grid-row: auto; }
}
</style>
