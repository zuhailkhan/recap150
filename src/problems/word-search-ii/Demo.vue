<script setup lang="ts">
import { computed, ref } from 'vue'
import { trie } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Words: oat, oath, eat. Tap cells to build a path. The trie says when a DFS would stop.
const board = [['o', 'a', 't'], ['e', 't', 'h']]
const words = ['oat', 'oath', 'eat']
const path = ref<[number, number][]>([])
const text = computed(() => path.value.map(([r, c]) => board[r][c]).join(''))
const isPrefix = computed(() => words.some((w) => w.startsWith(text.value)))
const isWord = computed(() => words.includes(text.value))
const dead = computed(() => path.value.length > 0 && !isPrefix.value)

const used = (r: number, c: number) => path.value.some(([a, b]) => a === r && b === c)
const canTap = (r: number, c: number) => {
  if (dead.value || used(r, c)) return false
  const last = path.value[path.value.length - 1]
  return !last || Math.abs(last[0] - r) + Math.abs(last[1] - c) === 1
}
const tap = (r: number, c: number) => { if (canTap(r, c)) path.value = [...path.value, [r, c]] }
const back = () => { path.value = path.value.slice(0, -1) }
const panel = computed(() => trie(words, { label: 'trie of the words', hot: isPrefix.value ? text.value : text.value.slice(0, -1), hotTone: dead.value ? 'miss' : 'hit' }))
const said = computed(() =>
  !text.value ? 'Tap a cell to start a path.'
    : dead.value ? `No word starts with "${text.value}". A DFS stops here and backs up, without exploring any further.`
    : isWord.value ? `"${text.value}" is a word. Record it, and keep going: a longer word may continue.`
    : `"${text.value}" is a prefix of a word, so keep going.`,
)
</script>

<template>
  <div class="d">
    <div class="b" role="group" aria-label="Board">
      <template v-for="(row, r) in board" :key="r">
        <button v-for="(ch, c) in row" :key="c" class="cell" :class="{ on: used(r, c), bad: dead && used(r, c) && path[path.length - 1][0] === r && path[path.length - 1][1] === c }" :disabled="!canTap(r, c)" :aria-label="`Row ${r + 1}, column ${c + 1}, letter ${ch}`" @click="tap(r, c)">{{ ch }}</button>
      </template>
    </div>
    <PanelView :panel="panel" />
    <p class="verdict" :class="{ bad: dead }" role="status">{{ said }}</p>
    <div class="row">
      <button class="btn" :disabled="!path.length" @click="back">Step back</button>
      <button class="btn" :disabled="!path.length" @click="path = []">Clear</button>
    </div>
  </div>
</template>

<style scoped>
.d { display: grid; gap: 10px; }
.b { display: grid; grid-template-columns: repeat(3, 56px); gap: 6px; }
.cell { min-width: 44px; min-height: 44px; font: inherit; font-size: 1.2rem; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; cursor: pointer; }
.cell.on { border-color: var(--focus-bd); background: var(--focus-bg); color: var(--focus-fg); }
.cell.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
.cell:disabled:not(.on) { opacity: 0.5; cursor: default; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.btn { min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); color: inherit; font: inherit; cursor: pointer; }
.btn:disabled { opacity: 0.5; cursor: default; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--keep-bd); background: var(--keep-bg); color: var(--keep-fg); }
.verdict.bad { border-color: var(--miss-bd); background: var(--miss-bg); color: var(--miss-fg); }
</style>
