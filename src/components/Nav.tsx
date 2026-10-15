import { useEffect, useState } from 'react'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <a className="nav-logo" href="#top">
          <span className="nav-logo-mark">RS</span>
          RS-Agent
        </a>
        <div className="nav-links">
          <a href="#architecture">系统架构</a>
          <a href="#features">核心技术</a>
          <a href="#pipeline">关键链路</a>
          <a href="#demo">在线演示</a>
          <a href="#benchmark">对比实验</a>
          <a className="nav-cta" href="#demo">▶ Live Demo</a>
        </div>
      </div>
    </nav>
  )
}
