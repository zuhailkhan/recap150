import type { Component } from 'vue'
import FingerprintDemo from './FingerprintDemo.vue'
import ComplementDemo from './ComplementDemo.vue'
import MatchDemo from './MatchDemo.vue'

export const DEMOS: Record<string, Component> = { fingerprint: FingerprintDemo, complement: ComplementDemo, match: MatchDemo }
