<script setup lang="ts">
import { computed, ref } from 'vue'
import MaskedCode from './MaskedCode.vue'
import type { LoadedVariant } from '@/data/problems'

const props = defineProps<{ variants: LoadedVariant[]; only?: boolean }>()
const active = ref(props.variants[0].id)
const v = computed(() => props.variants.find((x) => x.id === active.value) ?? props.variants[0])
</script>

<template>
  <div class="cs">
    <div v-if="variants.length > 1" class="toggle" role="group" aria-label="Approach">
      <span class="muted small">Approach</span>
      <button v-for="x in variants" :key="x.id" type="button" class="btn sm" :class="{ primary: x.id === v.id }" :aria-pressed="x.id === v.id" @click="active = x.id">{{ x.label }}</button>
    </div>
    <div class="blocks">
      <MaskedCode lang="pseudo" label="Pseudocode" :code="v.pseudo" :stages="v.stages" />
      <MaskedCode lang="ts" label="TypeScript" :code="v.ts" :stages="v.stages" />
      <MaskedCode lang="go" label="Go" :code="v.go" :stages="v.stages" />
    </div>
  </div>
</template>

<style scoped>
.cs { display: grid; gap: 14px; min-width: 0; }
.toggle { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.blocks { display: grid; gap: 14px; min-width: 0; }
</style>
