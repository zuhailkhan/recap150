<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { runTrace } from '@/core/tracer'
import type { Frame } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// The one moving thing on the home page: a real trace of Two Sum, looping slowly.
// With reduced motion it shows one still frame instead.
const frames = shallowRef<Frame[]>([])
const i = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(async () => {
  const mod = await import('@/problems/two-sum/ts/hashmap')
  frames.value = runTrace(mod.twoSum, [[2, 11, 15, 7], 9]).frames
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { i.value = 5; return }
  timer = setInterval(() => { i.value = (i.value + 1) % frames.value.length }, 1500)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <div class="hero stage" role="img" aria-label="A live example: the Two Sum algorithm running step by step">
    <div v-if="frames.length" class="inner" aria-hidden="true">
      <div class="panels"><PanelView v-for="(p, k) in frames[i].panels" :key="k" :panel="p" /></div>
      <p class="say"><span class="badge">{{ frames[i].stage }}</span>{{ frames[i].say }}</p>
    </div>
    <div v-else class="inner empty" aria-hidden="true"></div>
    <router-link class="to" to="/p/two-sum">Open Two Sum</router-link>
  </div>
</template>

<style scoped>
.hero { padding: 22px 22px 14px; min-height: 340px; display: grid; align-content: space-between; gap: 16px; }
.inner { display: grid; gap: 22px; min-width: 0; }
.empty { min-height: 250px; }
.panels { display: grid; gap: 20px; min-width: 0; }
.say { display: flex; gap: 12px; align-items: flex-start; margin: 0; min-height: 4.2em; font: 500 1.05rem/1.4 var(--font-ui); color: var(--ink); }
.say .badge { margin-top: 2px; }
.to { justify-self: end; font-size: .86rem; color: var(--ink-2); }
</style>
