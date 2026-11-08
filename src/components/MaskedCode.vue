<script setup lang="ts">
import { computed, ref } from 'vue'
import { highlight, type Lang } from '@/core/highlight'

const props = defineProps<{ lang: Lang; label: string; code: string; stages: { n: number; title: string; note: string }[] }>()
const revealed = ref(false)
const copied = ref(false)
const html = computed(() => highlight(props.code, props.lang))
const ext = computed(() => ({ pseudo: 'pseudo', ts: '.ts', go: '.go' })[props.lang])

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = props.code
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div class="code-card stage" :data-lang="lang">
    <div class="head">
      <span class="lang">{{ label }}<span class="ext">{{ ext }}</span></span>
      <span v-if="revealed" class="actions">
        <button class="btn sm quiet" type="button" @click="copy">{{ copied ? 'Copied' : 'Copy' }}</button>
        <button class="btn sm quiet" type="button" @click="revealed = false">Hide</button>
      </span>
    </div>
    <div class="body">
      <pre class="code" :class="{ masked: !revealed }" :aria-hidden="!revealed" :inert="!revealed" tabindex="0"><code v-html="html"></code></pre>
      <div v-if="!revealed" class="mask">
        <button class="btn primary" type="button" @click="revealed = true">Reveal {{ label }}</button>
      </div>
    </div>
    <div v-if="revealed" class="howto">
      <h4>How to read it</h4>
      <ol>
        <li v-for="s in stages" :key="s.n"><span class="badge">{{ s.n }}</span><span><strong>{{ s.title }}.</strong> {{ s.note }}</span></li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.code-card { background-image: none; background-color: #0c121a; border-radius: 12px; overflow: hidden; min-width: 0; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 8px 4px 18px; min-height: 48px; border-bottom: 1px solid var(--line); }
.lang { font: 600 .9rem var(--font-ui); display: inline-flex; align-items: baseline; gap: 8px; }
.ext { font: 500 .78rem var(--font-mono); color: var(--ink-3); }
.actions { display: flex; gap: 2px; }
.body { position: relative; }
pre { margin: 0; padding: 18px 20px; background: transparent; color: #dbe5ef; font-size: .875rem; line-height: 1.75; overflow: auto; max-width: 100%; tab-size: 2; }
pre code { background: none; padding: 0; font-size: inherit; color: inherit; }
pre.masked { filter: blur(6px); user-select: none; overflow: hidden; max-height: 22em; }
.mask { position: absolute; inset: 0; display: grid; place-items: center; background: repeating-linear-gradient(135deg, rgb(255 255 255 / 5%) 0 8px, transparent 8px 16px); }
.howto { padding: 16px 20px 20px; border-top: 1px solid var(--line); background: #0a1017; }
.howto h4 { margin: 0 0 12px; font: 600 .86rem var(--font-ui); color: var(--ink-2); }
ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
li { display: flex; gap: 12px; align-items: flex-start; font-size: .92rem; color: var(--ink-2); line-height: 1.5; }
li strong { color: var(--ink); font-weight: 600; }
li .badge { margin-top: 1px; }
</style>
