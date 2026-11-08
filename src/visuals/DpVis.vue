<script setup lang="ts">
import type { DpPanel } from '@/core/panels'
defineProps<{ p: DpPanel }>()
</script>

<template>
  <table class="dp" :aria-label="p.label ?? 'table'">
    <thead v-if="p.colLabels"><tr><th v-if="p.rowLabels"></th><th v-for="(c, i) in p.colLabels" :key="i">{{ c === '' ? '""' : c }}</th></tr></thead>
    <tbody>
      <tr v-for="(row, r) in p.cells" :key="r">
        <th v-if="p.rowLabels" scope="row">{{ p.rowLabels[r] === '' ? '""' : p.rowLabels[r] }}</th>
        <td v-for="(v, c) in row" :key="c"><span class="tile small" :class="p.tones?.[r]?.[c] ? `tone-${p.tones[r][c]}` : ''">{{ v === '' ? '·' : v }}</span></td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.dp { border-collapse: separate; border-spacing: 3px; }
th { font: 600 .75rem var(--font-mono); color: var(--ink-2); padding: 0 4px; text-align: center; }
td { padding: 0; }
.tile { min-width: 38px; }
@media (max-width: 480px) {
  .dp { border-spacing: 2px; }
  .tile { min-width: 30px; min-height: 34px; padding: 0 3px; font-size: .82rem; border-radius: 8px; }
  th { padding: 0 2px; font-size: .68rem; }
}
</style>
