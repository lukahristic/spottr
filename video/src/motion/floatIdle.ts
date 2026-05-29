interface FloatOptions {
  /** Peak vertical travel in px. */
  amp?: number;
  /** Period of one full bob, in frames. */
  period?: number;
  /** Phase offset in frames — stagger multiple floating elements. */
  phase?: number;
}

/**
 * Continuous gentle bob via a sine wave. Used for the phone and floating cards.
 * Returns px offset; caller composes it into a transform.
 */
export function floatIdle(
  frame: number,
  { amp = 10, period = 150, phase = 0 }: FloatOptions = {}
): number {
  return -Math.sin(((frame + phase) / period) * Math.PI * 2) * amp;
}
