import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { arr, stack as stackPanel, withTop } from '../../../core/panels'

export function dailyTemperatures(temps: number[], t: Tracer = noop): number[] {
  const answer: number[] = new Array(temps.length).fill(0) // [1] 0 means no warmer day ahead
  const stack: number[] = [] // [1] indices of days still waiting for a warmer day
  t.step(1, 'Every day starts with answer 0. The stack will hold the days that are still waiting for a warmer day.', [arr(temps, { label: 'temperature' }), stackPanel([], { label: 'waiting days (day: temp)', empty: 'empty' }), arr(answer, { label: 'days to wait' })])
  for (let i = 0; i < temps.length; i++) {
    while (stack.length > 0 && temps[i] > temps[stack[stack.length - 1]]) { // [2] today is warmer than the waiting day on top
      const j = stack.pop()!
      answer[j] = i - j // [2] that day has waited i - j days
      t.step(2, `Day ${i} is ${temps[i]}, warmer than day ${j} (${temps[j]}). Day ${j} waited ${i - j} day${i - j === 1 ? '' : 's'}. Pop it.`, [arr(temps, { label: 'temperature', tones: temps.map((_, k) => (k === i ? 'focus' : k === j ? 'hit' : stack.includes(k) ? 'keep' : k < i ? 'dim' : null)), pointers: [{ name: 'i', at: i }] }), withTop(stack.map((k) => `${k}: ${temps[k]}`), `${j}: ${temps[j]}`, 'hit'), arr(answer, { label: 'days to wait', tones: answer.map((_, k) => (k === j ? 'hit' : null)) })])
    }
    stack.push(i) // [3] today now waits for a warmer day
    t.step(3, `Push day ${i} (${temps[i]}). It waits for something warmer.`, [arr(temps, { label: 'temperature', tones: temps.map((_, k) => (k === i ? 'focus' : stack.includes(k) ? 'keep' : k < i ? 'dim' : null)), pointers: [{ name: 'i', at: i }] }), stackPanel(stack.map((k) => `${k}: ${temps[k]}`), { label: 'waiting days (day: temp)', tones: stack.map((_, k) => (k === stack.length - 1 ? 'focus' : null)) }), arr(answer, { label: 'days to wait' })])
  }
  t.step(4, stack.length ? `No days left. ${stack.length} day${stack.length === 1 ? ' never gets' : 's never get'} a warmer day, so ${stack.length === 1 ? 'it keeps' : 'they keep'} 0.` : 'No days left and nobody is waiting. Every day found a warmer one.', [arr(temps, { label: 'temperature', tones: temps.map((_, k) => (stack.includes(k) ? 'miss' : 'dim')) }), stackPanel(stack.map((k) => `${k}: ${temps[k]}`), { label: 'waiting days (day: temp)', tones: stack.map(() => 'miss' as const), empty: 'empty' }), arr(answer, { label: 'days to wait', tones: answer.map((v) => (v === 0 ? 'miss' : 'hit')) })])
  return answer // [4] days still on the stack keep 0
}
