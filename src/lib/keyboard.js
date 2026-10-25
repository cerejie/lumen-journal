import { useEffect, useState } from 'react'

/**
 * Ported from TARTAR (hook/app/keyboard.hook.ts).
 * Publishes how much of the screen the on-screen keyboard covers (--keyboard-inset) and the
 * visible height (--visual-viewport-height), so bottom sheets can sit right on top of the keyboard.
 */
const isTextEntry = (el) =>
  el instanceof HTMLElement &&
  (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['button', 'checkbox', 'radio', 'file'].includes(el.type)))

export function useKeyboardInset() {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const root = document.documentElement
    const coarse = window.matchMedia('(pointer: coarse)')

    const apply = () => {
      const covered = window.innerHeight - viewport.height - viewport.offsetTop
      root.style.setProperty('--keyboard-inset', `${Math.max(0, Math.round(covered))}px`)
      // Where sheets sit: on the keyboard when it is up, otherwise on the true bottom of the screen.
      root.style.setProperty('--sheet-lift', covered >= 1 ? `calc(${Math.round(covered)}px + var(--below-viewport))` : '0px')
      root.style.setProperty('--visual-viewport-height', `${Math.round(viewport.height)}px`)
      // iOS Safari scrolls the whole page up when the keyboard opens and leaves it there after it closes,
      // which strands fixed bars (the tab bar) higher on screen. Once the keyboard is gone, put the page back.
      if (covered < 1 && (window.scrollY !== 0 || viewport.offsetTop !== 0)) window.scrollTo(0, 0)
    }
    const mark = (el) => root.toggleAttribute('data-keyboard-open', coarse.matches && isTextEntry(el))
    const onFocusIn = (e) => mark(e.target)
    const onFocusOut = (e) => {
      mark(e.relatedTarget)
      if (!isTextEntry(e.relatedTarget)) setTimeout(() => window.scrollY !== 0 && window.scrollTo(0, 0), 100)
    }

    apply()
    viewport.addEventListener('resize', apply)
    viewport.addEventListener('scroll', apply)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      viewport.removeEventListener('resize', apply)
      viewport.removeEventListener('scroll', apply)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      root.style.removeProperty('--keyboard-inset')
      root.style.removeProperty('--sheet-lift')
      root.style.removeProperty('--visual-viewport-height')
      root.removeAttribute('data-keyboard-open')
    }
  }, [])
}

/** True on touch-first devices (phones, tablets), where text fields open in a bottom sheet. */
export function useIsCoarse() {
  const query = '(pointer: coarse)'
  const [coarse, setCoarse] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setCoarse(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return coarse
}
