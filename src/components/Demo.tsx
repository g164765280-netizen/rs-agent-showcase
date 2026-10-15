import { useEffect, useRef, useState } from 'react'
import { demoQAs } from '../data'
import { useTypewriter } from '../hooks'
import Reveal from './Reveal'
import LiveDemo from './LiveDemo'

type Phase = 'tracing' | 'typing' | 'done'
type Mode = 'preset' | 'live'

function PresetDemo() {
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
          * 预置演示:问答与调度轨迹基于真实系统设计录制;
          完整系统运行于本地 GPU 推理环境。切换到「实机演示」可现场提问。
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
  )
}

export default function Demo() {
  const [mode, setMode] = useState<Mode>('live')

  return (
    <section className="section" id="demo">
      <div className="container">
        <Reveal>
          <span className="section-tag">Live Demo</span>
          <h2 className="section-title">
            交互演示: <span className="gradient-text">调度过程全透明</span>
          </h2>
          <p className="section-desc">
            「实机演示」接入真实检索语料与 LLM API,可现场自由提问;「预置演示」为录制好的完整链路回放。
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="demo-tabs">
            <button
              className={`demo-tab ${mode === 'live' ? 'active' : ''}`}
              onClick={() => setMode('live')}
            >
              <span className="demo-tab-dot" />
              实机演示 · Live API
            </button>
            <button
              className={`demo-tab ${mode === 'preset' ? 'active' : ''}`}
              onClick={() => setMode('preset')}
            >
              预置演示 · 回放
            </button>
          </div>

          {mode === 'live' ? (
            <div className="demo-layout">
              <div className="card demo-side">
                <h4>实机通道说明</h4>
                <ul className="demo-live-list">
                  <li>编排路由 + 答案生成:<span className="num-tag">LLM API 实时调用</span></li>
                  <li>论文检索:<span className="num-tag">120 篇摘要 · 真实 BM25</span></li>
                  <li>数字查表:<span className="num-tag">8657 条指标库</span></li>
                  <li>影像工具:需 GPU,实机通道暂不开放</li>
                </ul>
                <p className="demo-note">
                  * 本页面为纯静态前端,实机请求发往本地后端(127.0.0.1:8790);
                  API Key 仅存于服务端 .env,不进入前端代码与仓库。
                </p>
              </div>

              <div className="card demo-window">
                <div className="demo-titlebar">
                  <span className="tl-dot" style={{ background: '#fb7185' }} />
                  <span className="tl-dot" style={{ background: '#fbbf24' }} />
                  <span className="tl-dot" style={{ background: '#34d399' }} />
                  <span className="tl-title">rs-agent — live session</span>
                </div>
                <div className="demo-body">
                  <LiveDemo />
                </div>
              </div>
            </div>
          ) : (
            <PresetDemo />
          )}
        </Reveal>
      </div>
    </section>
  )
}
