import { describe, expect, it } from 'vitest'
import { dayNumber, newCard, previewIntervals, review, isDue, isNew, isWeak } from '../src/recap/sm2'
import { buildDaily, buildCategory, buildWeak } from '../src/recap/scheduler'
import { RECAP } from '../src/recap/config'
import { compareProblemsForTest } from './helpers'

const NOW = new Date(2026, 0, 10, 15, 0).getTime()
const DAY = 86_400_000
const today = dayNumber(NOW)

describe('sm2', () => {
  it('first good review waits the configured first interval', () => {
    const c = review(newCard('a'), 'good', NOW)
    expect(c.interval).toBe(RECAP.firstIntervals.good)
    expect(c.due).toBe(today + RECAP.firstIntervals.good)
    expect(c.reps).toBe(1)
  })
  it('grows with ease after the second step', () => {
    let c = review(newCard('a'), 'good', NOW)
    c = review(c, 'good', NOW)
    expect(c.interval).toBe(RECAP.secondIntervals.good)
    const c3 = review(c, 'good', NOW)
    expect(c3.interval).toBe(Math.round(RECAP.secondIntervals.good * RECAP.startEase))
  })
  it('again resets reps, counts a lapse and lowers ease but never below the floor', () => {
    let c = review(newCard('a'), 'good', NOW)
    for (let i = 0; i < 20; i++) c = review(c, 'again', NOW)
    expect(c.reps).toBe(0)
    expect(c.lapses).toBe(20)
    expect(c.ease).toBe(RECAP.minEase)
    expect(c.interval).toBe(RECAP.lapseIntervalDays)
  })
  it('easy beats good beats hard', () => {
    let c = review(review(newCard('a'), 'good', NOW), 'good', NOW)
    c = review(c, 'good', NOW)
    const p = previewIntervals(c, NOW)
    expect(p.easy).toBeGreaterThan(p.good)
    expect(p.good).toBeGreaterThanOrEqual(p.hard)
    expect(p.again).toBe(RECAP.lapseIntervalDays)
  })
  it('due and new flags', () => {
    const c = review(newCard('a'), 'good', NOW)
    expect(isNew(newCard('a'))).toBe(true)
    expect(isDue(c, today)).toBe(false)
    expect(isDue(c, today + 1)).toBe(true)
  })
})

describe('scheduler', () => {
  const cands = ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({ id, category: i < 3 ? 'X' : 'Y' }))
  it('daily mix: due first (most overdue first), then limited new cards', () => {
    const cards = new Map([
      ['a', { ...review(newCard('a'), 'good', NOW - 5 * DAY) }],
      ['b', { ...review(newCard('b'), 'good', NOW - 9 * DAY) }],
    ])
    const mix = buildDaily(cands, cards, today)
    expect(mix.slice(0, 2)).toEqual(['b', 'a'])
    expect(mix.length).toBe(2 + RECAP.newPerDay)
    expect(mix.length).toBeLessThanOrEqual(RECAP.dailyCap)
  })
  it('category drill only has that category', () => {
    expect(buildCategory(cands, new Map(), today, 'Y')).toEqual(['d', 'e'])
  })
  it('weak spots are lapsed or low-ease cards, worst first', () => {
    const bad = review(review(newCard('a'), 'good', NOW), 'again', NOW)
    const ok = review(newCard('b'), 'good', NOW)
    expect(isWeak(bad)).toBe(true)
    expect(isWeak(ok)).toBe(false)
    expect(buildWeak(cands, new Map([['a', bad], ['b', ok]]))).toEqual(['a'])
  })
})

describe('catalog', () => {
  it('official list matches the expected category counts and total', () => {
    const { counts, total } = compareProblemsForTest()
    expect(total).toBe(150)
    expect(counts).toEqual({
      'Arrays & Hashing': 9, 'Two Pointers': 5, 'Sliding Window': 6, 'Stack': 7, 'Binary Search': 7, 'Linked List': 11,
      'Trees': 15, 'Tries': 3, 'Heap / Priority Queue': 7, 'Backtracking': 9, 'Graphs': 13, 'Advanced Graphs': 6,
      '1-D Dynamic Programming': 12, '2-D Dynamic Programming': 11, 'Greedy': 8, 'Intervals': 6, 'Math & Geometry': 8, 'Bit Manipulation': 7,
    })
  })
})
