import { ragPipeline, rlPipeline } from '../data'
import Reveal from './Reveal'

export default function Pipeline() {
  return (
    <section className="section" id="pipeline">
      <div className="container">
        <Reveal>
          <span className="section-tag">Pipelines</span>
          <h2 className="section-title">
            两条关键链路, <span className="gradient-text">步步可复现</span>
          </h2>
        </Reveal>

        <div className="pipeline-block">
          <Reveal>
            <div className="card pipe-card">
              <div className="pipe-head">
                <h3>RAG 检索生成链路</h3>
                <span className="mono">120 篇论文语料 · 双路召回 · 精排 top-4</span>
              </div>
              <div className="pipe-steps">
                {ragPipeline.map((s, i) => (
                  <div className="pipe-step" key={s.name}>
                    <span className="step-idx">STEP {String(i + 1).padStart(2, '0')}</span>
                    <div className="step-name">{s.name}</div>
                    <div className="step-note">{s.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="card pipe-card">
              <div className="pipe-head">
                <h3>RL 对齐全链路(LoRA)</h3>
                <span className="mono">SFT → merge → DPO → GRPO · 负收益如实归因</span>
              </div>
              <div className="pipe-steps">
                {rlPipeline.map((s, i) => (
                  <div className="pipe-step" key={s.name}>
                    <span className="step-idx">STEP {String(i + 1).padStart(2, '0')}</span>
                    <div className="step-name">{s.name}</div>
                    <div className="step-note">{s.note}</div>
                    <span className={`step-res ${s.warn ? 'warn' : ''}`}>{s.res}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
