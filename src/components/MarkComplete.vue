<script setup lang="ts">
import { computed, ref } from 'vue'
import { progress, markComplete, restoreCard } from '@/recap/store'
import type { CardState } from '@/recap/sm2'

const props = defineProps<{ cardId: string }>()
const card = computed(() => progress.cards.get(props.cardId))
const done = computed(() => !!card.value && card.value.reps > 0)
// what the card was before this visit's click, so Undo can put it back
const before = ref<{ id: string; prev: CardState | undefined } | null>(null)
const canUndo = computed(() => before.value?.id === props.cardId && done.value)

async function mark() { before.value = { id: props.cardId, prev: await markComplete(props.cardId) } }
async function undo() { if (before.value) { await restoreCard(before.value.id, before.value.prev); before.value = null } }
</script>

<template>
  <div class="mc">
    <button v-if="!done" type="button" class="btn" @click="mark">Mark complete</button>
    <template v-else>
      <span class="state" role="status"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>Completed</span>
      <button v-if="canUndo" type="button" class="undo" @click="undo">Undo</button>
    </template>
  </div>
</template>

<style scoped>
.mc { display: flex; align-items: center; gap: 12px; min-height: 44px; }
.state { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border-radius: 10px; border: 1.5px solid var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); font-weight: 600; }
.undo { min-height: 44px; padding: 0 8px; background: none; border: 0; color: var(--ink-2); text-decoration: underline; cursor: pointer; font: inherit; font-size: .92rem; }
</style>
