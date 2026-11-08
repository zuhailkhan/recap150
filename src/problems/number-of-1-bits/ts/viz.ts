// Trace-only helpers for the bits panel. Never shown on the page.
// A bits row draws `w` digits, left digit first. These build the tones for those digits.
import type { Tone, Tones } from '../../../core/panels'

/** Digits to draw: 6 for values under 64 (so a phone row fits), then 8, 16, or 32 when a value is negative or large. */
export const wd = (...vs: number[]): number => (vs.some((v) => v < 0 || v > 65535) ? 32 : vs.some((v) => v > 255) ? 16 : vs.some((v) => v > 63) ? 8 : 6)

const bit = (v: number, k: number): number => (v >>> k) & 1

/** Tone on every digit where v has a 1. */
export const lit = (w: number, v: number, tone: Tone): Tones => Array.from({ length: w }, (_, i) => (bit(v, w - 1 - i) ? tone : null))

/** Tone on every digit where a and b differ. */
export const diff = (w: number, a: number, b: number, tone: Tone): Tones => Array.from({ length: w }, (_, i) => (bit(a, w - 1 - i) !== bit(b, w - 1 - i) ? tone : null))

/** Tone on one digit, counted from the right (0 is the lowest bit). */
export const at = (w: number, k: number, tone: Tone): Tones => Array.from({ length: w }, (_, i) => (w - 1 - i === k ? tone : null))

/** Tone on the lowest digit that is a 1. */
export const low = (w: number, v: number, tone: Tone): Tones => at(w, 31 - Math.clz32(v & -v), tone)
