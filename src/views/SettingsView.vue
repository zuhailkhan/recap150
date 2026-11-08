<script setup lang="ts">
import { ref } from 'vue'
import { exportBackup, importBackup, parseBackup, progress, resetAll } from '@/recap/store'

const pasted = ref('')
const mode = ref<'merge' | 'replace'>('merge')
const message = ref('')
const isError = ref(false)
const copied = ref(false)

function say(text: string, error = false) { message.value = text; isError.value = error }

function download() {
  const blob = new Blob([exportBackup()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `recap150-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  say('Backup file downloaded.')
}
async function copy() {
  try { await navigator.clipboard.writeText(exportBackup()); copied.value = true; setTimeout(() => (copied.value = false), 1500); say('Backup copied to the clipboard.') }
  catch { say('Copy was blocked by the browser. Use Download instead.', true) }
}
async function doImport(text: string) {
  const { backup, error } = parseBackup(text)
  if (!backup) return say(error!, true)
  if (mode.value === 'replace' && !confirm('Replace all current progress with this backup?')) return
  await importBackup(backup, mode.value)
  say(`Imported ${backup.cards.length} card${backup.cards.length === 1 ? '' : 's'} (${mode.value}).`)
  pasted.value = ''
}
async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) await doImport(await f.text())
  ;(e.target as HTMLInputElement).value = ''
}
async function wipe() {
  if (!confirm('Delete all review progress on this device? This cannot be undone.')) return
  await resetAll()
  say('All progress cleared.')
}
</script>

<template>
  <div class="st">
    <h1>Backup</h1>
    <p class="muted">Your progress lives only in this browser. Export it to move it to another device or keep a copy.</p>
    <p class="muted small">{{ progress.cards.size }} card{{ progress.cards.size === 1 ? '' : 's' }} stored.</p>

    <section class="card">
      <h2>Export</h2>
      <div class="row"><button class="btn primary" type="button" @click="download">Download JSON file</button><button class="btn" type="button" @click="copy">{{ copied ? 'Copied' : 'Copy JSON' }}</button></div>
    </section>

    <section class="card">
      <h2>Import</h2>
      <fieldset>
        <legend class="small muted">When cards overlap</legend>
        <label class="opt"><input v-model="mode" type="radio" value="merge" /> Merge. Keep whichever copy was reviewed more recently.</label>
        <label class="opt"><input v-model="mode" type="radio" value="replace" /> Replace everything with the backup.</label>
      </fieldset>
      <div class="row"><label class="btn" for="file">Choose a backup file</label><input id="file" class="sr-only" type="file" accept="application/json,.json" @change="onFile" /></div>
      <label for="paste" class="small muted">Or paste the JSON here</label>
      <textarea id="paste" v-model="pasted" rows="5" spellcheck="false" placeholder='{"app":"recap150", ...}'></textarea>
      <div class="row"><button class="btn" type="button" :disabled="!pasted.trim()" @click="doImport(pasted)">Import pasted JSON</button></div>
    </section>

    <p v-if="message" class="msg" :class="{ err: isError }" role="status">{{ message }}</p>

    <section class="card">
      <h2>Reset</h2>
      <p class="small muted">Removes every review, rating and streak from this device.</p>
      <button class="btn danger" type="button" @click="wipe">Delete all progress</button>
    </section>
  </div>
</template>

<style scoped>
.st { max-width: 720px; display: grid; gap: 28px; }
.st h1, .st p { margin: 0; }
.card { display: grid; gap: 12px; padding: 0 0 24px; background: transparent; border: 0; border-bottom: 1px solid var(--line); border-radius: 0; }
.card h2 { margin: 0; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
fieldset { border: 0; padding: 0; margin: 0; display: grid; gap: 2px; }
.opt { display: flex; gap: 10px; align-items: center; min-height: 44px; }
.opt input { width: 20px; height: 20px; accent-color: var(--ink); }
textarea { width: 100%; font: .85rem var(--font-mono); padding: 12px; color: var(--ink); background: var(--surface); border: 1.5px solid var(--line); border-radius: var(--radius-s); resize: vertical; }
.msg { padding: 12px 14px; border-radius: var(--radius-s); background: var(--hit-bg); color: var(--hit-fg); border: 1.5px solid var(--hit-bd); }
.msg.err { background: var(--miss-bg); color: var(--miss-fg); border-color: var(--miss-bd); }
.danger { color: var(--miss-fg); border-color: var(--miss-bd); }
.danger:hover:not(:disabled) { background: var(--miss-bg); border-color: var(--miss-bd); }
</style>
