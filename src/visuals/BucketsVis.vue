<script setup lang="ts">
import type { BucketsPanel } from '@/core/panels'
import Tile from './Tile.vue'
defineProps<{ p: BucketsPanel }>()
</script>

<template>
  <div class="bv" role="group" :aria-label="p.label ?? 'bins'">
    <div v-if="p.keyLabel && p.buckets.length" class="kl muted small">{{ p.keyLabel }}</div>
    <div v-for="b in p.buckets" :key="b.key" class="bin" :class="b.tone ? `hot-${b.tone}` : ''">
      <span class="key" :class="b.tone ? `tone-${b.tone}` : ''">{{ b.key === '' ? '""' : b.key }}</span>
      <span class="items"><Tile v-for="(it, i) in b.items" :key="i" :value="it" :tone="b.itemTones?.[i] ?? (b.tone === 'hit' ? 'hit' : null)" small /></span>
    </div>
    <div v-if="!p.buckets.length" class="empty muted small">{{ p.empty ?? 'empty' }}</div>
  </div>
</template>

<style scoped>
.bv { display: flex; flex-direction: column; gap: 8px; }
.bin { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 2px dashed var(--line); border-radius: 12px; background: var(--surface-2); min-width: 0; }
.bin.hot-focus { border-color: var(--focus-bd); border-style: solid; }
.bin.hot-hit { border-color: var(--hit-bd); border-style: solid; }
.key { font: 700 .88rem var(--font-mono); padding: 4px 10px; border-radius: 8px; background: var(--tile-bg); color: var(--tile-fg); border: 1.5px solid var(--tile-bd); flex: none; max-width: 45%; overflow-wrap: anywhere; }
.items { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
.empty { padding: 10px; border: 2px dashed var(--line); border-radius: 12px; text-align: center; }
</style>
