<script setup lang="ts">
defineProps<{ value: string | number; tone?: string | null; small?: boolean }>()
</script>

<template>
  <span class="tile" :class="[tone ? `tone-${tone}` : '', { small }]">{{ value === '' ? '""' : value }}</span>
</template>
