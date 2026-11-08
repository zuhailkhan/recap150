<script setup lang="ts">
import { computed, ref } from 'vue'
import MaskedCode from './MaskedCode.vue'
interface CodeVariant { id: string; label: string; pseudo?: string; ts: string; go: string; stages: { n: number; title: string; note: string }[] }

const props = defineProps<{ variants: CodeVariant[]; only?: boolean; hidePseudo?: boolean }>()
const active = ref(props.variants[0].id)
const v = computed(() => props.variants.find((x) => x.id === active.value) ?? props.variants[0])
</script>

<template>
  <div class="cs">
    <div v-if="variants.length > 1" class="toggle" role="group" aria-label="Approach">
      <span class="muted small">Approach</span>
      <div class="seg">
        <button v-for="x in variants" :key="x.id" type="button" class="btn sm" :aria-pressed="x.id === v.id" @click="active = x.id">{{ x.label }}</button>
      </div>
    </div>
    <div class="blocks">
      <MaskedCode v-if="!hidePseudo && v.pseudo" lang="pseudo" label="Pseudocode" :code="v.pseudo" :stages="v.stages" />
      <MaskedCode lang="ts" label="TypeScript" :code="v.ts" :stages="v.stages" />
      <MaskedCode lang="go" label="Go" :code="v.go" :stages="v.stages" />
    </div>
  </div>
</template>

<style scoped>
.cs { display: grid; gap: 16px; min-width: 0; }
.toggle { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.seg { display: inline-flex; gap: 6px; flex-wrap: wrap; }
.blocks { display: grid; gap: 16px; min-width: 0; }
</style>
