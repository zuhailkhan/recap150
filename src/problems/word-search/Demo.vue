<script setup lang="ts">
import { computed, ref } from 'vue'
import { arr } from '@/core/panels'
import PanelView from '@/visuals/PanelView.vue'

// Spell CATS by tapping cells. A cell in the path is marked and cannot be used again until you undo.
const board = [['C', 'A', 'T'], ['A', 'T', 'S']]
const word = 'CATS'
const path = ref<[number, number][]>([])
const note = ref('Tap a C to start.')
const last = computed(() => path.value[path.value.length - 1])
const inPath = (r: number, c: number) => path.value.some(([pr, pc]) => pr === r && pc === c)
const done = computed(() => path.value.length === word.length)
function tap(r: number, c: number) {
  if (done.value) { note.value = 'The word is complete. Undo to try another route.'; return }
  const k = path.value.length
  if (inPath(r, c)) note.value = `(${r},${c}) is already in the path, marked #. It cannot be used twice.`
  else if (last.value && Math.abs(last.value[0] - r) + Math.abs(last.value[1] - c) !== 1) note.value = `(${r},${c}) does not touch the last cell. Move up, down, left or right.`
  else if (board[r][c] !== word[k]) note.value = `(${r},${c}) holds ${board[r][c]}, but letter ${k + 1} is ${word[k]}. Dead end.`
  else { path.value.push([r, c]); note.value = k + 1 === word.length ? `Spelled ${word}. The word exists.` : `Matched ${word[k]}. Next letter: ${word[k + 1]}.` }
}
const wordPanel = computed(() => arr(word.split(''), { label: 'word', tones: word.split('').map((_, i) => (i < path.value.length ? (done.value ? 'hit' : 'keep') : i === path.value.length ? 'focus' : null)) }))
</script>

<template>
  <div class="dws">
    <div class="board" role="group" aria-label="Board, tap cells to spell the word">
      <template v-for="(row, r) in board" :key="r">
        <button v-for="(ch, c) in row" :key="c" type="button" class="cell" :class="{ used: inPath(r, c), tip: !!last && last[0] === r && last[1] === c, win: done && inPath(r, c) }" :aria-label="`Row ${r}, column ${c}, letter ${ch}`" @click="tap(r, c)">{{ inPath(r, c) ? '#' : ch }}</button>
      </template>
    </div>
    <PanelView :panel="wordPanel" />
    <p class="verdict" :class="{ ok: done }" role="status">{{ note }}</p>
    <div class="keys">
      <button class="btn quiet" type="button" :disabled="!path.length" @click="path.pop(); note = 'Undo: the letter is put back on the board.'">Undo</button>
      <button class="btn quiet" type="button" :disabled="!path.length" @click="path = []; note = 'Cleared. Tap a C to start.'">Clear</button>
    </div>
  </div>
</template>

<style scoped>
.dws { display: grid; gap: 10px; }
.board { display: grid; grid-template-columns: repeat(3, 56px); gap: 6px; }
.cell { min-width: 44px; min-height: 56px; font-family: var(--font-mono); font-size: 1.3rem; font-weight: 700; border-radius: 10px; border: 2px solid var(--tile-bd); background: var(--tile-bg); color: var(--tile-fg); cursor: pointer; }
.cell.used { background: var(--keep-bg); color: var(--keep-fg); border-color: var(--keep-bd); }
.cell.tip { background: var(--focus-bg); color: var(--focus-fg); border-color: var(--focus-bd); }
.cell.win { background: var(--hit-bg); color: var(--hit-fg); border-color: var(--hit-bd); }
.keys { display: flex; gap: 8px; }
.keys .btn { min-height: 44px; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 10px; border: 2px solid var(--line); background: var(--surface-2); }
.verdict.ok { border-color: var(--hit-bd); background: var(--hit-bg); color: var(--hit-fg); }
</style>
