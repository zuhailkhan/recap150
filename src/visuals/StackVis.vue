<script setup lang="ts">
import { computed } from 'vue'
import type { StackPanel } from '@/core/panels'
import Tile from './Tile.vue'
const props = defineProps<{ p: StackPanel }>()
/** Show the top first. */
const rows = computed(() => props.p.items.map((v, i) => ({ v, i })).reverse())
</script>

<template>
  <div class="sv" role="group" :aria-label="p.label ?? 'stack'">
    <div class="well">
      <div v-for="(r, k) in rows" :key="r.i" class="row">
        <Tile :value="r.v" :tone="p.tones?.[r.i]" />
        <span v-if="k === 0" class="top muted small">← top</span>
      </div>
      <div v-if="!rows.length" class="empty muted small">{{ p.empty ?? 'empty' }}</div>
    </div>
  </div>
</template>

<style scoped>
.well { display: flex; flex-direction: column; gap: 6px; min-width: 96px; min-height: 64px; padding: 8px 12px 10px; border: 2px solid var(--line); border-top: 0; border-radius: 0 0 14px 14px; background: var(--surface-2); width: max-content; max-width: 100%; }
.row { display: flex; align-items: center; gap: 8px; }
.empty { align-self: center; padding: 14px 0; }
</style>
