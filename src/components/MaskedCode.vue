<script setup lang="ts">
import { computed, ref } from 'vue'
import { highlight, type Lang } from '@/core/highlight'

const props = defineProps<{ lang: Lang; label: string; code: string; stages: { n: number; title: string; note: string }[] }>()
const revealed = ref(false)
const copied = ref(false)
const html = computed(() => highlight(props.code, props.lang))

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
  <div class="code-card" :data-lang="lang">
    <div class="head">
      <span class="lang">{{ label }}</span>
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
.code-card { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); overflow: hidden; min-width: 0; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px 6px 14px; min-height: 52px; border-bottom: 1px solid var(--line); background: var(--surface-2); }
.lang { font: 700 .85rem var(--font-body); letter-spacing: .04em; text-transform: uppercase; }
.actions { display: flex; gap: 4px; }
.body { position: relative; }
pre { margin: 0; padding: 16px; background: var(--code-bg); color: var(--code-fg); font-size: .88rem; line-height: 1.7; overflow: auto; max-width: 100%; tab-size: 2; }
pre code { background: none; padding: 0; font-size: inherit; }
pre.masked { filter: blur(6px); user-select: none; overflow: hidden; max-height: 22em; }
.mask { position: absolute; inset: 0; display: grid; place-items: center; background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, transparent) 0 10px, transparent 10px 20px); }
.howto { padding: 12px 16px 16px; border-top: 1px solid var(--line); }
.howto h4 { margin: 0 0 8px; font: 700 .8rem var(--font-body); text-transform: uppercase; letter-spacing: .08em; color: var(--ink-2); }
ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
li { display: flex; gap: 10px; align-items: flex-start; font-size: .93rem; }
</style>
