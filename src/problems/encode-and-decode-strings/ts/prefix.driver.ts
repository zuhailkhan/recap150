import type { Tracer } from '../../../core/tracer'
import { noop } from '../../../core/tracer'
import { decodeList, encodeList } from './prefix'

/** Encode then decodeList. A correct pair returns the input list unchanged. Forwards the tracer. */
export function roundTrip(strs: string[], t: Tracer = noop): string[] {
  return decodeList(encodeList(strs, t), t)
}
