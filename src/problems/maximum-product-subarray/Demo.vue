<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr, dp as dpPanel, type Tone } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// A negative x flips big and small: the old smallest times x can become the new biggest.
const x = ref(-2)
const prevHi = 6
const prevLo = -3
const cand = computed(() => [x.value, x.value * prevHi, x.value * prevLo])
const newHi = computed(() => Math.max(...cand.value))
const newLo = computed(() => Math.min(...cand.value))
const fromWhich = (v: number) => (v === x.value ? 'start fresh' : v === x.value * prevHi ? 'x × old hi' : 'x × old lo')
const tones = computed<Tone[]>(() => cand.value.map((v) => (v === newHi.value ? 'hit' : v === newLo.value ? 'miss' : 'dim')))
const candidates = computed(() => arr([...cand.value], { label: 'three candidates: x, x × old hi, x × old lo', tones: tones.value }))
const table = computed(() => dpPanel([[prevHi, prevLo], [newHi.value, newLo.value]], { label: 'hi and lo before and after this x', rowLabels: ['before', 'after'], colLabels: ['hi', 'lo'], tones: [[null, null], ['hit', 'miss']] }))
</script>

<template>
  <div class="d">
    <label class="fld">Next number x = {{ x }} <input v-model.number="x" type="range" min="-5" max="5" /></label>
    <PanelView :panel="candidates" />
    <PanelView :panel="table" />
    <p class="say" role="status">
      New hi = <strong>{{ newHi }}</strong> ({{ fromWhich(newHi) }}). New lo = <strong>{{ newLo }}</strong> ({{ fromWhich(newLo) }}).
    </p>
    <p class="muted small">Old hi is 6 and old lo is -3. Slide x below zero: the old lo, times a negative, becomes the biggest.</p>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.fld { display: grid; gap: 4px; font-weight: 600; }
.fld input { min-height: 44px; accent-color: var(--accent); }
.say { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); font-family: var(--font-mono); overflow-wrap: anywhere; }
</style>
