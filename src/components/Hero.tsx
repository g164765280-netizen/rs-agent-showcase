import { project } from '../data'

export default function Hero() {
  return (
    <header className="hero" id="top">
      <div className="container hero-grid">
        <div>
          <span className="hero-badge">
            <span className="dot" />
            个人项目 · 多智能体 · RAG · 遥感变化检测
          </span>
          <h1>
            <span className="gradient-text">{project.name}</span>
          </h1>
          <div className="hero-sub">{project.title}</div>
          <p className="hero-desc">
            {project.tagline}。从零构建混合检索 RAG 链路、SFT→DPO→GRPO 对齐全链路与防泄漏评测体系,
            编排者-工作者架构经图式升级实现并行调度。
          </p>
          <div className="hero-stack">
            {project.stack.map((s) => (
              <span className="stack-pill" key={s}>
                {s}
              </span>
            ))}
          </div>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#demo">
              ▶ 观看交互演示
            </a>
            <a className="btn btn-ghost" href="#architecture">
              了解系统架构 ↓
            </a>
          </div>
        </div>

        <div className="hero-visual" aria-hidden>
          <div className="radar">
            <div className="radar-ring" />
            <div className="radar-ring" />
            <div className="radar-ring" />
            <div className="radar-ring" />
            <div className="radar-sweep" />
            <span className="radar-blip" style={{ top: '26%', left: '62%', animationDelay: '0.4s' }} />
            <span className="radar-blip" style={{ top: '58%', left: '30%', animationDelay: '1.3s' }} />
            <span className="radar-blip" style={{ top: '70%', left: '70%', animationDelay: '2.1s' }} />
            <span className="radar-blip" style={{ top: '38%', left: '18%', animationDelay: '2.8s' }} />
            <div className="radar-core">
              <div className="radar-core-box">
                <span className="mono">ORCHESTRATOR</span>
                <strong>6 Agents Online</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-scroll">SCROLL</div>
    </header>
  )
}
