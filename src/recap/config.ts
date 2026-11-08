// Every tunable number for the recap scheduler lives here. Nothing else hard-codes these.
export const RECAP = {
  /** Most cards in the daily mix. */
  dailyCap: 10,
  /** How many never-seen cards the daily mix may add after the due ones. */
  newPerDay: 3,
  /** Cards in a "weak spots" drill. */
  weakCap: 10,
  /** Ease factor: how fast intervals grow. */
  startEase: 2.5,
  minEase: 1.3,
  easeDelta: { again: -0.2, hard: -0.15, good: 0, easy: 0.15 },
  /** Days until the next review after the first and second successful recalls. */
  firstIntervals: { hard: 1, good: 1, easy: 3 },
  secondIntervals: { hard: 2, good: 3, easy: 6 },
  /** After the second step, interval grows by ease times these multipliers. */
  hardMultiplier: 1.2,
  easyBonus: 1.3,
  /** Days to wait after pressing Again. */
  lapseIntervalDays: 1,
  /** In one session, show an "Again" card once more at the end. */
  requeueAgain: true,
  /** A card counts as mastered once its interval reaches this many days. */
  masteredDays: 21,
  /** A card is a weak spot if it has lapsed, or its ease sank below this. */
  weakEase: 2.3,
} as const

export type Grade = 'again' | 'hard' | 'good' | 'easy'
export const GRADES: Grade[] = ['again', 'hard', 'good', 'easy']
