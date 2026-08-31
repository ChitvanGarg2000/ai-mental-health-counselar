import type { TargetAndTransition, Transition } from 'motion/react'

export function fadeRise(reduceMotion: boolean | null) {
  if (reduceMotion) {
    return {
      initial: false as const,
      animate: { opacity: 1, y: 0 } satisfies TargetAndTransition,
      exit: { opacity: 1, y: 0 } satisfies TargetAndTransition,
      transition: { duration: 0 } satisfies Transition,
    }
  }

  return {
    initial: { opacity: 0, y: 10 } satisfies TargetAndTransition,
    animate: { opacity: 1, y: 0 } satisfies TargetAndTransition,
    exit: { opacity: 0, y: -6 } satisfies TargetAndTransition,
    transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] } satisfies Transition,
  }
}
