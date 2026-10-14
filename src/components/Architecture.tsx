import { agents } from '../data'
import Reveal from './Reveal'

/* 布局常量(viewBox 1000×620) */
const VW = 1000
const NODE_W = 140
const NODE_H = 58
const WORKER_Y = 268
const workerX = (i: number) => 30 + i * (NODE_W + 20)

export default function Architecture() {
  return (
    <section className="section" id="architecture">
      <div className="container">
        <Reveal>
          <span className="section-tag">Architecture</span>
          <h2 className="section-title">
            编排者-工作者架构, <span className="gradient-text">图式并行调度</span>
          </h2>
          <p className="section-desc">
            Qwen3-8B 作为编排者统一调度 6 个能力 Agent;本地推理环境下自实现 function-calling 协议,
            全部能力经 MCP 暴露为标准工具,新增能力只需注册一条,调度器零改动。
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="card arch-wrap">
            <svg className="arch-svg" viewBox={`0 0 ${VW} 620`} role="img" aria-label="RS-Agent 系统架构图">
              <defs>
                <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="coreGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgba(34,211,238,0.22)" />
                  <stop offset="100%" stopColor="rgba(59,130,246,0.22)" />
                </linearGradient>
              </defs>

              {/* Query → Orchestrator */}
              <path className="arch-edge" d="M500 66 L500 108" />
              <path className="arch-edge-flow" d="M500 66 L500 108" />

              {/* Orchestrator → Workers */}
              {agents.map((a, i) => {
                const cx = workerX(i) + NODE_W / 2
                const d = `M500 172 C500 216, ${cx} 214, ${cx} ${WORKER_Y - 4}`
                return (
                  <g key={`e-${a.id}`}>
                    <path className="arch-edge" d={d} />
                    <path className="arch-edge-flow" d={d} style={{ animationDelay: `${i * 0.18}s` }} />
                  </g>
                )
              })}

              {/* Workers → MCP 层 */}
              {agents.map((a, i) => {
                const cx = workerX(i) + NODE_W / 2
                return (
                  <g key={`m-${a.id}`}>
                    <path className="arch-edge" d={`M${cx} ${WORKER_Y + NODE_H + 2} L${cx} 398`} />
                    <path
                      className="arch-edge-flow"
                      d={`M${cx} ${WORKER_Y + NODE_H + 2} L${cx} 398`}
                      style={{ animationDelay: `${i * 0.12 + 0.4}s` }}
                    />
                  </g>
                )
              })}

              {/* MCP → 数据层 */}
              <path className="arch-edge" d="M500 452 L500 490" />
              <path className="arch-edge-flow" d="M500 452 L500 490" style={{ animationDelay: '0.8s' }} />

              {/* Query 节点 */}
              <g className="arch-node-group">
                <rect className="arch-node-box" x={390} y={18} width={220} height={48} rx={12} />
                <text x={500} y={39} textAnchor="middle" fill="#e8eefb" fontSize={15} fontWeight={600}>
                  User Query
                </text>
                <text x={500} y={56} textAnchor="middle" fill="#5d6b85" fontSize={11}>
                  论文问答 · 变化分析 · 前景查询
                </text>
              </g>

              {/* Orchestrator 节点 */}
              <g className="arch-node-group">
                <rect
                  x={360}
                  y={110}
                  width={280}
                  height={62}
                  rx={14}
                  fill="url(#coreGrad)"
                  stroke="rgba(34,211,238,0.55)"
                  strokeWidth={1.4}
                />
                <text x={500} y={137} textAnchor="middle" fill="#22d3ee" fontSize={16} fontWeight={700}>
                  Orchestrator · Qwen3-8B
                </text>
                <text x={500} y={156} textAnchor="middle" fill="#9aa8c0" fontSize={11}>
                  自实现 function-calling · 意图路由 · 任务拆解
                </text>
              </g>

              {/* Worker 节点 */}
              {agents.map((a, i) => {
                const x = workerX(i)
                return (
                  <g className="arch-node-group" key={a.id}>
                    <rect className="arch-node-box" x={x} y={WORKER_Y} width={NODE_W} height={NODE_H} rx={12} />
                    <text x={x + NODE_W / 2} y={WORKER_Y + 26} textAnchor="middle" fill="#e8eefb" fontSize={14} fontWeight={600}>
                      {a.name}
                    </text>
                    <text x={x + NODE_W / 2} y={WORKER_Y + 44} textAnchor="middle" fill="#5d6b85" fontSize={10.5} fontFamily="SF Mono, Menlo, monospace">
                      {a.en}
                    </text>
                  </g>
                )
              })}

              {/* MCP 工具层 */}
              <g className="arch-node-group">
                <rect x={30} y={400} width={940} height={52} rx={12} fill="rgba(129,140,248,0.08)" stroke="rgba(129,140,248,0.35)" />
                <text x={500} y={423} textAnchor="middle" fill="#a5b4fc" fontSize={14.5} fontWeight={600}>
                  MCP 标准工具层
                </text>
                <text x={500} y={441} textAnchor="middle" fill="#5d6b85" fontSize={11}>
                  全部能力注册为标准工具 · 能力插件化:新增能力 = 注册一条
                </text>
              </g>

              {/* 数据层 */}
              <g className="arch-node-group">
                <rect x={30} y={492} width={940} height={52} rx={12} fill="rgba(13,20,38,0.85)" stroke="rgba(148,163,184,0.2)" />
                <text x={500} y={515} textAnchor="middle" fill="#9aa8c0" fontSize={13.5} fontWeight={600}>
                  数据与索引层
                </text>
                <text x={500} y={533} textAnchor="middle" fill="#5d6b85" fontSize={11} fontFamily="SF Mono, Menlo, monospace">
                  FAISS · BM25 · bge-m3 · 120 篇论文语料 · 指标-数字查表库
                </text>
              </g>
            </svg>

            <div className="arch-legend">
              <span className="arch-legend-item">
                <span className="arch-legend-swatch" style={{ background: 'linear-gradient(120deg,#22d3ee,#3b82f6)' }} />
                编排核心(Qwen3-8B)
              </span>
              <span className="arch-legend-item">
                <span className="arch-legend-swatch" style={{ background: 'rgba(17,26,48,0.95)', border: '1px solid rgba(148,163,184,0.35)' }} />
                能力 Agent × 6
              </span>
              <span className="arch-legend-item">
                <span className="arch-legend-swatch" style={{ background: 'rgba(129,140,248,0.3)' }} />
                MCP 工具层
              </span>
              <span className="arch-legend-item mono" style={{ fontSize: 12 }}>
                ─ ─ 实时调用流(流动虚线)
              </span>
            </div>

            <div className="arch-upgrade">
              <div className="arch-stage">
                <h4>
                  星型主干 <span className="stage-chip">V1 · 中心式</span>
                </h4>
                <ul>
                  <li>编排者中枢调度,Worker 只与中心通信</li>
                  <li>任务串行执行,链路清晰但吞吐受限</li>
                  <li>自实现 function-calling 协议跑通本地推理</li>
                </ul>
              </div>
              <div className="arch-upgrade-arrow">⇒</div>
              <div className="arch-stage next">
                <h4>
                  图型升级 <span className="stage-chip on">V2 · 并行调度</span>
                </h4>
                <ul>
                  <li>任务依赖图 + Agent 间直接通信 + 并行执行</li>
                  <li>2 × 0.5s 任务实测 0.51s,≈0 串行损耗</li>
                  <li>模型服务化:量化 30B 经 vLLM 服务化,编排与模型解耦</li>
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
