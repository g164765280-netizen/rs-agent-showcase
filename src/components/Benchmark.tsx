import Reveal from './Reveal'

/* 2026-10-15 实测 v2:16 题 × 2 组,同模型(deepseek-v4-flash)控制变量
   A = RS-Agent 本地 RAG(关思考);C+ = 公网搜索 + 同模型开思考(满血联网大模型)
   原始数据: server/compare_report_v2.json, 评测脚本 server/compare_eval.py */

const rows: { label: string; a: string; c: string; win: 'a' | 'c' | 'tie' }[] = [
  { label: '数字题命中(5 题)', a: '5/5 · 0 幻觉', c: '0/5 · 全部只能拒答', win: 'a' },
  { label: '引用可精确溯源', a: '48/48 到 arXiv 原文', c: '公网链接,摘要级粒度', win: 'a' },
  { label: '平均延迟', a: '14.6s', c: '19.2s(思考链)', win: 'a' },
  { label: 'Token 消耗/题', a: '无思考链', c: '689–1584(思考链计费)', win: 'a' },
  { label: '总结/理解题质量', a: '2.5 要点/题,贴语料', c: '2.4 要点/题,表达更教科书', win: 'tie' },
  { label: '幻觉风险', a: '数字逐字回溯原文', c: '0 幻觉,但数字题无答案', win: 'a' },
]

/* LLM-as-judge 盲评(11 道非数字题):隐去来源 + 位置随机 + 四维度 1-5 分 */
const judgeDims = [
  { label: '证据忠实度', a: 3.91, c: 3.55 },
  { label: '信息深度', a: 3.36, c: 3.36 },
  { label: '结构清晰度', a: 4.27, c: 4.18 },
  { label: '实用价值', a: 3.36, c: 3.55 },
]

const judgeByType = [
  { type: '概念题 ×4', aWin: 4, cWin: 0, note: 'A 点名具体方法与机制(DDPM / Mask R-CNN 先验)' },
  { type: '多论文总结 ×3', aWin: 2, cWin: 1, note: 'A 引用到具体论文;C+ 的证据/归纳分离更严谨' },
  { type: '领域理解 ×3', aWin: 0, cWin: 3, note: '纯机制推理题,C+ 通用推理更深(误差累积/虚警机理)' },
]

export default function Benchmark() {
  return (
    <section className="section" id="benchmark">
      <div className="container">
        <Reveal>
          <span className="section-tag">Benchmark</span>
          <h2 className="section-title">
            对比实验: <span className="gradient-text">本地 RAG vs 满血联网大模型</span>
          </h2>
          <p className="section-desc">
            16 道题(5 数字 + 5 概念 + 3 多论文总结 + 3 领域理解)× 两组配置,同一模型(deepseek-v4-flash)控制变量,
            对手开启完整思考链。评测脚本与原始数据随仓库开源,完全可复现。
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="card bench-v2">
            <div className="bench-v2-head">
              <div />
              <div className="bench-v2-col-title tone-good">A · RS-Agent 本地 RAG</div>
              <div className="bench-v2-col-title tone-mid">C+ · 联网搜索 + 思考</div>
            </div>
            {rows.map((r) => (
              <div className="bench-v2-row" key={r.label}>
                <div className="bench-v2-label">{r.label}</div>
                <div className={`bench-v2-cell ${r.win === 'a' ? 'cell-good' : ''}`}>{r.a}</div>
                <div className={`bench-v2-cell ${r.win === 'c' ? 'cell-good' : ''}`}>{r.c}</div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="bench-case card">
            <div className="bench-case-title">代表性样本 · 同一模型,同一问题</div>
            <div className="bench-case-q">「WHU-CD 数据集上 F1 最高的方法是哪个?数值是多少?」</div>
            <div className="bench-case-grid">
              <div className="bench-case-col mid">
                <div className="bench-case-tag">C+ 联网大模型(思考链)</div>
                <p>
                  "两条摘要中<strong>均未包含具体的 F1 数值</strong>……要回答该问题需查阅全文表格。
                  具体 F1 数值<strong>不能编造</strong>,建议打开原文核实。"
                </p>
                <p className="bench-case-note">
                  回答非常严谨——但论文数值锁在 PDF 表格里,公网搜索拿不到。诚实,却没有答案。
                </p>
              </div>
              <div className="bench-case-col good">
                <div className="bench-case-tag">✓ RS-Agent 本地 RAG</div>
                <p>
                  "WHU-CD 上 F1 最高的是 <strong>Ours</strong>(FAF-CD 论文),cf1 = <strong className="num-good">95.37</strong>[1],
                  略高于 NeXt2Former-CD 的 95.31[3] 和 3D-SSM 的 95.30[4]。"
                </p>
                <p className="bench-case-note">数字逐字来自本地指标库原文抽取,LLM 全程不回忆数字。</p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={180}>
          <div className="card judge-card">
            <div className="judge-head">
              <div>
                <div className="judge-title">LLM-as-judge 盲评 · 非数字题质量</div>
                <div className="judge-sub">
                  11 题 · 隐去来源 + 位置随机 · 四维度 1-5 分 · 裁判与答题同模型(偏差对等)
                </div>
              </div>
              <div className="judge-score mono">
                <span className="tone-good">A 6</span>
                <span className="judge-score-sep">:</span>
                <span className="tone-mid">5 C+</span>
              </div>
            </div>

            <div className="judge-dims">
              {judgeDims.map((d) => (
                <div className="judge-dim" key={d.label}>
                  <div className="judge-dim-label">{d.label}</div>
                  <div className="judge-bars">
                    <div className="judge-bar-row">
                      <span className="judge-bar-tag mono">A</span>
                      <div className="judge-bar-track">
                        <div className="judge-bar-fill a" style={{ width: `${(d.a / 5) * 100}%` }} />
                      </div>
                      <span className="judge-bar-val mono">{d.a.toFixed(2)}</span>
                    </div>
                    <div className="judge-bar-row">
                      <span className="judge-bar-tag mono">C+</span>
                      <div className="judge-bar-track">
                        <div className="judge-bar-fill c" style={{ width: `${(d.c / 5) * 100}%` }} />
                      </div>
                      <span className="judge-bar-val mono">{d.c.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="judge-types">
              {judgeByType.map((t) => (
                <div className="judge-type" key={t.type}>
                  <div className="judge-type-name">{t.type}</div>
                  <div className="judge-type-score mono">
                    <span className={t.aWin > t.cWin ? 'tone-good' : ''}>{t.aWin}</span>
                    {' : '}
                    <span className={t.cWin > t.aWin ? 'tone-mid' : ''}>{t.cWin}</span>
                  </div>
                  <div className="judge-type-note">{t.note}</div>
                </div>
              ))}
            </div>

            <div className="judge-foot">
              洞察:RAG 补的是<strong>知识</strong>,不是<strong>推理</strong>——需要引用具体论文的题(数字/概念/总结 9:1)碾压;
              纯机制推理题(0:3)满血大模型占优。
            </div>
          </div>
        </Reveal>

        <Reveal delay={220}>
          <div className="bench-conclusion">
            <span className="bench-conclusion-icon">◆</span>
            <p>
              结论:<strong>精确领域知识(指标/数值)上本地 RAG 不可替代</strong>——满血联网大模型 5 题全数拒答;
              开放性总结与领域理解上两者打平。而对手开启思考链后反而<strong>更慢更贵</strong>(19.2s vs 14.6s,思考 token 另计费)。
              生成端切本地 vLLM 部署后,<strong>API 费用归零、数据不出域</strong>。
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
