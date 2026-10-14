import { ReactNode } from 'react'
import { features } from '../data'
import Reveal from './Reveal'

/** 解析 <b> <up> <tag> 占位标记为 React 节点 */
export function renderRich(text: string): ReactNode[] {
  const parts = text.split(/(<b>.*?<\/b>|<up>.*?<\/up>|<tag>.*?<\/tag>)/g)
  return parts.map((p, i) => {
    if (p.startsWith('<b>')) return <strong key={i}>{p.slice(3, -4)}</strong>
    if (p.startsWith('<up>'))
      return (
        <span key={i} className="num-up">
          {p.slice(4, -5)}
        </span>
      )
    if (p.startsWith('<tag>'))
      return (
        <span key={i} className="num-tag">
          {p.slice(5, -6)}
        </span>
      )
    return <span key={i}>{p}</span>
  })
}

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <Reveal>
          <span className="section-tag">Core Techniques</span>
          <h2 className="section-title">
            四大核心技术, <span className="gradient-text">全部从零落地</span>
          </h2>
          <p className="section-desc">
            检索、对齐、协同、评测——每条链路都给出可复现的量化结果,负收益如实归因。
          </p>
        </Reveal>

        <div className="features-grid">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 90}>
              <div className="card feature-card">
                <div className="feature-head">
                  <div className="feature-icon">{f.icon}</div>
                  <div>
                    <div className="feature-title">{f.title}</div>
                    <div className="feature-sub">{f.sub}</div>
                  </div>
                </div>
                <ul className="feature-list">
                  {f.points.map((p, j) => (
                    <li key={j}>{renderRich(p)}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
