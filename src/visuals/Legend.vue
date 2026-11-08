<template>
  <ul class="legend" aria-label="Color key">
    <li><i class="sw tone-focus"></i>looking at</li>
    <li><i class="sw tone-keep"></i>remembered</li>
    <li><i class="sw tone-hit"></i>match</li>
    <li><i class="sw tone-miss"></i>mismatch</li>
    <li><i class="sw tone-dim"></i>done</li>
  </ul>
</template>

<style scoped>
.legend { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 4px 16px; font: 500 .72rem var(--font-mono); color: var(--ink-3); }
.legend li { display: inline-flex; align-items: center; gap: 6px; }
.sw { width: 11px; height: 11px; border-radius: 3px; border: 1.5px solid; box-shadow: none !important; }
</style>
