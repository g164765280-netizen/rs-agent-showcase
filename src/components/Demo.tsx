import { useEffect, useRef, useState } from 'react'
import { demoQAs } from '../data'
import { useTypewriter } from '../hooks'
import Reveal from './Reveal'

type Phase = 'tracing' | 'typing' | 'done'

export default function Demo() {
  const [qaId, setQaId] = useState(demoQAs[0].id)
  const [runId, setRunId] = useState(0) // 重放计数
  const [visibleTrace, setVisibleTrace] = useState(0)
  const [phase, setPhase] = useState<Phase>('tracing')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const qa = demoQAs.find((q) => q.id === qaId)!

  const { out: typed, done: typedDone } = useTypewriter(
    qa.answer,
    phase !== 'tracing',
    14,
  )

  // trace 逐行出现 → 全部出现后进入打字机阶段
  useEffect(() => {
    setVisibleTrace(0)
    setPhase('tracing')
    timers.current.forEach(clearTimeout)
    timers.current = qa.trace.map((_, i) =>
      setTimeout(() => setVisibleTrace(i + 1), 420 * (i + 1)),
    )
    timers.current.push(
      setTimeout(() => setPhase('typing'), 420 * qa.trace.length + 350),
    )
    return () => timers.current.forEach(clearTimeout)
  }, [qaId, runId])

  useEffect(() => {
    if (typedDone) setPhase('done')
  }, [typedDone])

  const pick = (id: string) => {
    if (id === qaId) return
    setQaId(id)
  }

  return (
    <section className="section" id="demo">
      <div className="container">
        <Reveal>
          <span className="section-tag">Live Demo</span>
          <h2 className="section-title">
            交互演示: <span className="gradient-text">调度过程全透明</span>
          </h2>
          <p className="section-desc">
            选择一个预置问题,观察编排者如何路由意图、调度能力 Agent,并给出带引用、可溯源的回答。
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="demo-layout">
            <div className="card demo-side">
              <h4>预置问题</h4>
              {demoQAs.map((q) => (
                <button
                  key={q.id}
                  className={`demo-q ${q.id === qaId ? 'active' : ''}`}
                  onClick={() => pick(q.id)}
                >
                  <span className="q-tag">{q.tag}</span>
                  {q.question}
                </button>
              ))}
              <p className="demo-note">
                * 本页为静态展示版:问答与调度轨迹基于真实系统设计预置,
                完整系统运行于本地 GPU 推理环境。
              </p>
            </div>

            <div className="card demo-window">
              <div className="demo-titlebar">
                <span className="tl-dot" style={{ background: '#fb7185' }} />
                <span className="tl-dot" style={{ background: '#fbbf24' }} />
                <span className="tl-dot" style={{ background: '#34d399' }} />
                <span className="tl-title">rs-agent — orchestrator session</span>
              </div>

              <div className="demo-body">
                {/* 用户提问 */}
                <div className="demo-user">
                  <div className="demo-avatar">🧑</div>
                  <div className="demo-msg">
                    <div className="demo-msg-role">USER</div>
                    <div className="demo-msg-text">{qa.question}</div>
                  </div>
                </div>

                {/* 调度轨迹 */}
                <div className="demo-trace">
                  <div className="demo-trace-head">
                    <span>◈ ORCHESTRATION TRACE</span>
                    <span className="ok">
                      {visibleTrace >= qa.trace.length ? '✓ done' : 'running…'}
                    </span>
                  </div>
                  {qa.trace.slice(0, visibleTrace).map((t, i) => (
                    <div className="demo-trace-line" key={`${runId}-${qaId}-${i}`}>
                      <span className="t-agent">[{t.agent}]</span>
                      <span>{t.action}</span>
                      <span className="t-time">{t.time}</span>
                    </div>
                  ))}
                </div>

                {/* 回答 */}
                {phase !== 'tracing' && (
                  <div className="demo-user">
                    <div className="demo-avatar ai">RS</div>
                    <div className="demo-msg">
                      <div className="demo-msg-role">RS-AGENT</div>
                      <div className="demo-msg-text demo-answer">
                        <span dangerouslySetInnerHTML={{ __html: typed }} />
                        {!typedDone && <span className="cursor" />}
                      </div>

                      {phase === 'done' && (
                        <>
                          <div className="demo-cites">
                            {qa.cites.map((c, i) => (
                              <div
                                className="demo-cite"
                                key={i}
                                style={{ animationDelay: `${i * 0.25}s` }}
                              >
                                <span className="c-idx">[{i + 1}]</span>
                                <span>{c.text}</span>
                                <span className="c-src">{c.src}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            className="demo-replay"
                            onClick={() => setRunId((n) => n + 1)}
                          >
                            ↻ 重新播放
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
