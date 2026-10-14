import { useEffect, useRef, useState } from 'react'

/** 元素进入视口时触发一次 */
export function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ob = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true)
            ob.unobserve(e.target)
          }
        })
      },
      { threshold },
    )
    ob.observe(el)
    return () => ob.disconnect()
  }, [threshold])

  return { ref, inView }
}

/** 数字滚动动画:仅在 active 变 true 后执行一次 */
export function useCountUp(target: number, active: boolean, duration = 1600, decimals = 0) {
  const [value, setValue] = useState(0)
  const done = useRef(false)

  useEffect(() => {
    if (!active || done.current) return
    done.current = true
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      // easeOutExpo
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setValue(parseFloat((target * eased).toFixed(decimals)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target, duration, decimals])

  return value
}

/** 打字机:文本逐步输出;active=false 时清空 */
export function useTypewriter(text: string, active: boolean, speed = 16) {
  const [out, setOut] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!active) {
      setOut('')
      setDone(false)
      return
    }
    setOut('')
    setDone(false)
    // 按纯文本长度步进,避免 HTML 标签被截断显示
    const plain = text.replace(/<[^>]+>/g, '')
    let i = 0
    const timer = setInterval(() => {
      i += 1
      if (i >= plain.length) {
        setOut(text) // 完成时直接渲染完整富文本
        setDone(true)
        clearInterval(timer)
      } else {
        setOut(plain.slice(0, i))
      }
    }, speed)
    return () => clearInterval(timer)
  }, [text, active, speed])

  return { out, done }
}
