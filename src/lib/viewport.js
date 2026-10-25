import { useEffect } from 'react'

/**
 * iOS home-screen apps sometimes get a viewport that stops above the home indicator, leaving a bare strip
 * below it and pushing anything that adds the safe area (the tab bar) up a second time.
 * Detect that case and publish:
 *   --below-viewport  how far the screen continues under the viewport (backgrounds extend into it)
 *   --nav-bottom      where the floating tab bar should sit
 */
function measureSafeBottom() {
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;bottom:0;height:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden'
  document.body.appendChild(probe)
  const px = parseFloat(getComputedStyle(probe).paddingBottom) || 0
  probe.remove()
  return px
}

export function useViewportFix() {
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
      const portrait = window.innerHeight > window.innerWidth
      const screenHeight = portrait ? Math.max(screen.height, screen.width) : Math.min(screen.height, screen.width)
      const safe = measureSafeBottom()
      const missing = Math.round(screenHeight - window.innerHeight)
      // The viewport is short when it is missing roughly the home-indicator height (keyboard closed).
      const short = standalone && safe > 0 && missing > 8 && Math.abs(missing - safe) <= 12
      root.toggleAttribute('data-short-viewport', short)
      root.style.setProperty('--below-viewport', short ? `${missing}px` : '0px')
    }
    apply()
    window.addEventListener('resize', apply)
    window.addEventListener('orientationchange', apply)
    return () => {
      window.removeEventListener('resize', apply)
      window.removeEventListener('orientationchange', apply)
    }
  }, [])
}
