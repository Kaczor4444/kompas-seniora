'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

type Props = {
  value:    number
  suffix?:  string
  duration?: number   // sekundy
  decimals?: number
}

export default function AnimatedCounter({ value, suffix = '', duration = 1.4, decimals = 0 }: Props) {
  const [display, setDisplay] = useState(0)
  const ref     = useRef<HTMLSpanElement>(null)
  const inView  = useInView(ref, { once: true, margin: '-40px' })

  useEffect(() => {
    if (!inView) return
    const startTime = performance.now()
    const ms = duration * 1000

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / ms, 1)
      // easeOutCubic — szybki start, wolne dojście
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(parseFloat((eased * value).toFixed(decimals)))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [inView, value, duration, decimals])

  const formatted = decimals > 0
    ? display.toLocaleString('pl-PL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(display).toLocaleString('pl-PL')

  return <span ref={ref}>{formatted}{suffix}</span>
}
