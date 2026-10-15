import { useEffect, useRef, useState } from 'react'
import { useTypewriter } from '../hooks'

const API = 'http://127.0.0.1:8790'

interface TraceLine {
  agent: string
  action: string
  time: string
}

interface LiveResult {
  trace: TraceLine[]
  answer: string
  cites: { text: string; src: string }[]
}

type Health = 'checking' | 'ok' | 'no_server' | 'no_key'

const SUGGESTIONS = [
  'LEVIR-CD 数据集上 F1 最高的方法是哪个?',
  '无监督变化检测有哪些主流思路?',
  '扩散模型在变化检测里是怎么用的?',
]

export default function LiveDemo() {
  const [health, setHealth] = useState<Health>('checking')
  const [model, setModel] = useState('')
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<LiveResult | null>(null)
  const [visibleTrace, setVisibleTrace] = useState(0)
  const [typing, setTyping] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const { out: typed, done: typedDone } = useTypewriter(result?.answer ?? '', typing, 12)

  useEffect(() => {
    fetch(`${API}/api/health`)
      .then((r) => r.json())
      .then((d) => {
        setModel(d.model || '')
        setHealth(d.has_api_key ? 'ok' : 'no_key')
      })
      .catch(() => setHealth('no_server'))
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const ask = async (q?: string) => {
    const question = (q ?? input).trim()
    if (!question || busy) return
    setBusy(true)
    setError('')
    setResult(null)
    setQuestion(question)
    setVisibleTrace(0)
    setTyping(false)
    if (q) setInput(q)
    try {
      const r = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const d = await r.json()
      if (!d.ok) {
        setError(d.error === 'no_api_key' ? '后端未配置 API Key,请检查 server/.env' : `调用失败:${d.error}`)
        setBusy(false)
        return
      }
      const res = d as LiveResult
      // trace 逐行展示 → 打字机输出回答
      timers.current = res.trace.map((_, i) =>
        setTimeout(() => setVisibleTrace(i + 1), 460 * (i + 1)),
      )
      timers.current.push(
        setTimeout(() => {
          setResult(res)
          setTyping(true)
          setBusy(false)
        }, 460 * res.trace.length + 300),
      )
    } catch {
      setError('无法连接实机后端(127.0.0.1:8790),请确认 run.sh 已启动')
      setBusy(false)
    }
  }

  if (health === 'no_server' || health === 'no_key') {
    return (
      <div className="demo-live-tip">
        <div className="demo-live-tip-title">
          {health === 'no_server' ? '⚠ 实机后端未启动' : '⚠ 后端已启动,但未配置 API Key'}
        </div>
        <p>实机通道 = 真实检索(120 篇论文摘要 + 8657 条指标库)+ 真实 LLM API 编排生成。启动方式:</p>
        <pre>
{`cd rsagent-showcase/server
cp .env.example .env   # 填入你的 API key
./run.sh               # 监听 127.0.0.1:8790`}
        </pre>
        <p className="demo-live-tip-foot">启动后回到此页刷新即可。GitHub Pages 线上版不含实机通道(需本地后端)。</p>
      </div>
    )
  }

  return (
    <div>
      <div className="demo-live-bar">
        <span className="demo-live-dot" />
        LIVE · {model || 'LLM API'} · 真实检索 120 篇论文 / 8657 条指标
      </div>

      <div className="demo-ask">
        <input
          className="demo-input"
          placeholder="向 RS-Agent 提问(遥感变化检测相关)…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          disabled={busy}
        />
        <button className="demo-send" onClick={() => ask()} disabled={busy || health !== 'ok'}>
          {busy ? '调度中…' : '发送 →'}
        </button>
      </div>

      <div className="demo-suggest">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="demo-chip" onClick={() => ask(s)} disabled={busy}>
            {s}
          </button>
        ))}
      </div>

      {error && <div className="demo-error">{error}</div>}

      {question && (
        <>
          <div className="demo-user">
            <div className="demo-avatar">🧑</div>
            <div className="demo-msg">
              <div className="demo-msg-role">USER</div>
              <div className="demo-msg-text">{question}</div>
            </div>
          </div>

          {busy && (
            <div className="demo-loading">
              <span className="demo-spinner" /> 编排器调度中,正在调用 LLM API…
            </div>
          )}

          {visibleTrace > 0 && (
            <div className="demo-trace">
              <div className="demo-trace-head">
                <span>◈ ORCHESTRATION TRACE · 实测耗时</span>
                <span className="ok">{result ? '✓ done' : 'running…'}</span>
              </div>
              {(result?.trace ?? []).slice(0, visibleTrace).map((t, i) => (
                <div className="demo-trace-line" key={i}>
                  <span className="t-agent">[{t.agent}]</span>
                  <span>{t.action}</span>
                  <span className="t-time">{t.time}</span>
                </div>
              ))}
            </div>
          )}

          {result && typing && (
            <div className="demo-user">
              <div className="demo-avatar ai">RS</div>
              <div className="demo-msg">
                <div className="demo-msg-role">RS-AGENT · LIVE</div>
                <div className="demo-msg-text demo-answer">
                  {typed}
                  {!typedDone && <span className="cursor" />}
                </div>
                {typedDone && result.cites.length > 0 && (
                  <div className="demo-cites">
                    {result.cites.map((c, i) => (
                      <div className="demo-cite" key={i} style={{ animationDelay: `${i * 0.25}s` }}>
                        <span className="c-idx">[{i + 1}]</span>
                        <span>{c.text}</span>
                        <span className="c-src">{c.src}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
