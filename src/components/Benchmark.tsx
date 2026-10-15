import Reveal from './Reveal'

/* 2026-10-15 实测:10 题 × 3 组,同模型(deepseek-v4-flash)控制变量
   原始数据: server/compare_report.json, 评测脚本 server/compare_eval.py */

const groups = [
  {
    key: 'A',
    name: 'RS-Agent(本系统)',
    sub: '本地 RAG + 查表 + LLM 生成',
    hit: '5/5',
    hitPct: 100,
    hallucination: 0,
    cite: '40/40',
    latency: '16.3s',
    cost: '2 次调用/题',
    tone: 'good',
  },
  {
    key: 'B',
    name: '裸调大模型',
    sub: '同一模型,纯参数记忆,无检索',
    hit: '0/5',
    hitPct: 0,
    hallucination: 7,
    cite: '0/0',
    latency: '6.9s',
    cost: '1 次调用/题',
    tone: 'bad',
  },
  {
    key: 'C',
    name: '联网搜索 + LLM',
    sub: '公网搜索证据 + 同一模型生成',
    hit: '0/5',
    hitPct: 0,
    hallucination: 0,
    cite: '0/0',
    latency: '6.2s',
    cost: '1 次调用/题 + 搜索',
    tone: 'mid',
  },
]

const rows: { label: string; key: keyof (typeof groups)[0]; mono?: boolean }[] = [
  { label: '数字题命中(5 题)', key: 'hit', mono: true },
  { label: '幻觉数字(个)', key: 'hallucination', mono: true },
  { label: '引用可溯源', key: 'cite', mono: true },
  { label: '平均延迟', key: 'latency', mono: true },
  { label: 'API 调用', key: 'cost' },
]

export default function Benchmark() {
  return (
    <section className="section" id="benchmark">
      <div className="container">
        <Reveal>
          <span className="section-tag">Benchmark</span>
          <h2 className="section-title">
            对比实验: <span className="gradient-text">为什么需要 RAG?</span>
          </h2>
          <p className="section-desc">
            10 道领域题(5 数字 + 5 概念)× 3 组配置,同一模型控制变量,2026-10-15 实测。
            评测脚本与原始数据随仓库开源,完全可复现。
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="bench-table card">
            <div className="bench-row bench-head">
              <div className="bench-cell bench-label" />
              {groups.map((g) => (
                <div className="bench-cell bench-group" key={g.key}>
                  <div className={`bench-name tone-${g.tone}`}>{g.name}</div>
                  <div className="bench-sub">{g.sub}</div>
                </div>
              ))}
            </div>
            {rows.map((r) => (
              <div className="bench-row" key={r.label}>
                <div className="bench-cell bench-label">{r.label}</div>
                {groups.map((g) => {
                  const v = String(g[r.key])
                  const isGood = g.tone === 'good'
                  const isBad = g.tone === 'bad' && (r.key === 'hit' || r.key === 'hallucination' || r.key === 'cite')
                  return (
                    <div className={`bench-cell ${r.mono ? 'mono' : ''} ${isGood ? 'cell-good' : ''} ${isBad ? 'cell-bad' : ''}`} key={g.key}>
                      {r.key === 'hallucination' && g.tone === 'bad' ? `${v} 个编造` : v}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="bench-case card">
            <div className="bench-case-title">幻觉实锤 · 同一模型,同一问题</div>
            <div className="bench-case-q">「LEVIR-CD 数据集上 F1 最高的方法是哪个?数值是多少?」</div>
            <div className="bench-case-grid">
              <div className="bench-case-col bad">
                <div className="bench-case-tag">✗ 裸模型回答</div>
                <p>
                  "<strong>ChangeFormer</strong> 在 LEVIR-CD 上曾达到约 <strong className="num-bad">90.4%</strong> 的 F1,
                  是该数据集上表现最好的方法之一。"
                </p>
                <p className="bench-case-note">方法错、数值错,且语气自信;同一编造数字「90.4%」在多题中复现。</p>
              </div>
              <div className="bench-case-col good">
                <div className="bench-case-tag">✓ RS-Agent 回答</div>
                <p>
                  "LEVIR-CD 上 F1 最高的是 <strong>SemDINO</strong>,F1 = <strong className="num-good">92.97%</strong>[1]。
                  其后 LWGANet 与 Ensemble of Best Specialists(均 92.42)……"
                </p>
                <p className="bench-case-note">数字逐字来自指标库原文抽取记录,LLM 全程不回忆数字。</p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={220}>
          <div className="bench-conclusion">
            <span className="bench-conclusion-icon">◆</span>
            <p>
              RAG 用 <strong>~2.4× 延迟</strong>换来 <strong className="num-good">100% 数字忠实</strong> +
              <strong className="num-good"> 100% 引用可溯源</strong>;联网搜索拿不到论文表格里的精确数值(5 题全部只能拒答)。
              而生成端切换为本地 vLLM 部署的 Qwen3-8B 后,<strong>API 费用归零、数据不出域</strong>——这正是正式系统的配置。
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
