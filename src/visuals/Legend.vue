<template>
  <ul class="legend" aria-label="Color key">
    <li><span class="sw tone-focus"></span>looking at now</li>
    <li><span class="sw tone-keep"></span>remembered</li>
    <li><span class="sw tone-hit"></span>match / answer</li>
    <li><span class="sw tone-miss"></span>mismatch</li>
    <li><span class="sw tone-dim"></span>already handled</li>
  </ul>
</template>

<style scoped>
.legend { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: .8rem; color: var(--ink-2); }
.legend li { display: inline-flex; align-items: center; gap: 6px; }
.sw { width: 16px; height: 16px; border-radius: 5px; border: 2px solid; }
</style>
