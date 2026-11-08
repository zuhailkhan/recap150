<script setup lang="ts">
import { computed } from 'vue'
import type { BitsPanel } from '@/core/panels'
const props = defineProps<{ p: BitsPanel }>()
const w = computed(() => props.p.width ?? Math.max(8, ...props.p.rows.map((r) => Math.max(0, r.value).toString(2).length)))
const digits = (v: number) => (v >>> 0).toString(2).padStart(w.value, '0').slice(-w.value).split('')
</script>

<template>
  <div class="bv" role="group" :aria-label="p.label ?? 'bits'">
    <div v-for="r in p.rows" :key="r.label" class="row">
      <span class="lab">{{ r.label }}</span>
      <span class="digits"><span v-for="(d, i) in digits(r.value)" :key="i" class="tile small bit" :class="r.tones?.[i] ? `tone-${r.tones[i]}` : d === '1' ? 'on' : ''">{{ d }}</span></span>
      <span class="dec muted small">= {{ r.value }}</span>
    </div>
  </div>
</template>

<style scoped>
.bv { display: grid; gap: 8px; }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; }
.lab { min-width: 48px; font: 700 .85rem var(--font-mono); }
.digits { display: flex; gap: 2px; }
.bit { min-width: 24px; min-height: 30px; padding: 0 2px; font-size: .85rem; border-width: 1.5px; }
.bit.on { background: var(--keep-bg); color: var(--keep-fg); border-color: var(--keep-bd); }
.dec { white-space: nowrap; }
</style>
