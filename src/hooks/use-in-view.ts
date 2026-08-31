import { useEffect, useRef, useState, type RefObject } from 'react'

export interface UseInViewOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
  /** Stop observing after the first intersection. `hasEntered` stays true. */
  once?: boolean
}

export interface UseInViewResult<T extends Element> {
  ref: RefObject<T | null>
  inView: boolean
  /** True after the element has entered the viewport at least once. */
  hasEntered: boolean
  /** False when IntersectionObserver is missing — render content without waiting. */
  observerSupported: boolean
}

export function useInView<T extends Element = HTMLElement>(
  options: UseInViewOptions = {},
): UseInViewResult<T> {
  const { root = null, rootMargin = '0px', threshold = 0, once = false } = options
  const observerSupported = typeof IntersectionObserver !== 'undefined'

  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(!observerSupported)
  const [hasEntered, setHasEntered] = useState(!observerSupported)

  useEffect(() => {
    if (!observerSupported) return

    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        const visible = entry.isIntersecting
        setInView(visible)

        if (visible) {
          setHasEntered(true)
          if (once) observer.disconnect()
        }
      },
      { root, rootMargin, threshold },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [observerSupported, root, rootMargin, threshold, once])

  return { ref, inView, hasEntered, observerSupported }
}
