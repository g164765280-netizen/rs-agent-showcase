/* RS-Agent 项目内容数据（源自简历，面向面试展示优化） */

export const project = {
  name: 'RS-Agent',
  title: '遥感变化检测多智能体专家系统',
  period: '2026.03 — 2026.05',
  tagline: '由编排模型统一调度多子专家 Agent，支持论文分析、领域知识查询与前景分析',
  stack: ['Qwen3-8B', 'Qwen3-VL', 'bge-m3', 'BM25', 'FAISS', 'PEFT / TRL', 'RAGAS', 'MCP', 'vLLM'],
}

export interface Metric {
  value: number
  decimals?: number
  suffix?: string
  unit?: string
  label: string
  delta?: string
  deltaNeutral?: boolean
}

export const metrics: Metric[] = [
  { value: 120, suffix: '篇', label: '遥感论文语料 · 从零建库', delta: 'PDF 解析 → 切块 → 索引', deltaNeutral: true },
  { value: 6, suffix: '个', label: '能力 Agent · 编排调度', delta: '自实现 function-calling', deltaNeutral: true },
  { value: 97.2, decimals: 1, suffix: '%', label: '数字忠实度', delta: '17.4% → 97.2% · ↑5.6×' },
  { value: 98.2, decimals: 1, suffix: '%', label: '回答引用率', delta: '13.6% → 98.2% · ↑7.2×' },
  { value: 0.51, decimals: 2, unit: 's', label: '并行调度实测耗时', delta: '2 × 0.5s 任务 · ≈0 串行损耗', deltaNeutral: true },
]

export interface ArchNode {
  id: string
  name: string
  en: string
}

export const agents: ArchNode[] = [
  { id: 'retrieval', name: '文本检索', en: 'Retrieval' },
  { id: 'table', name: '数字查表', en: 'Num-Table' },
  { id: 'vision', name: '影像解读', en: 'Vision · VL' },
  { id: 'change', name: '变化检测', en: 'Change-Det' },
  { id: 'fusion', name: '知识融合', en: 'Fusion' },
  { id: 'report', name: '报告生成', en: 'Report' },
]

export interface Feature {
  icon: string
  title: string
  sub: string
  points: string[] // 支持 <b> <em class up/tag> 的占位写法,在组件中解析
}

export const features: Feature[] = [
  {
    icon: '⛁',
    title: 'RAG · 混合检索 + 数字确定性通道',
    sub: 'HYBRID RETRIEVAL & NUMERIC TABLE-LOOKUP',
    points: [
      '从零构建 <b>120 篇论文语料</b>完整 RAG 链路:PDF 解析与切块建索引、<b>BM25 + bge-m3 双路召回 → CrossEncoder 精排 top-4</b>',
      '三约束生成 + <b>贪心解码</b>,保证输出可复现',
      '针对数字幻觉设计<b>查表通道</b>:正则抽取「指标-数字」对并回溯原文原句,<b>LLM 全程不回忆数字</b>',
      '数字忠实度 <up>17.4% → 89.7%</up>(对照实验换基座后达 <up>97.2%</up>)',
    ],
  },
  {
    icon: '∇',
    title: 'RL · 对齐全链路 + 诚实负结果',
    sub: 'SFT → MERGE → DPO → GRPO (LORA)',
    points: [
      '完成 <b>SFT → merge → DPO → GRPO</b> 对齐全链路(LoRA),引用率 <up>13.6% → 56.6%</up>',
      'DPO / GRPO 负收益均<b>如实归因</b>,不藏负结果',
      '对照实验:换基座 Qwen3-8B 全面超过整条微调线(引用 <up>98.2%</up>、数字 <up>97.2%</up>)',
    ],
  },
  {
    icon: '⌘',
    title: '多 Agent 协同 · 星型主干 + 图型升级',
    sub: 'ORCHESTRATOR-WORKER → GRAPH SCHEDULING',
    points: [
      'Qwen3-8B 编排调度 <b>6 能力 Agent</b>:文本检索 / 数字查表 / 影像解读 / 变化检测 / 知识融合 / 报告生成',
      '本地推理环境下<b>自实现 function-calling 协议</b>,全部能力经 <b>MCP</b> 对外暴露为标准工具',
      '调度从中心式升级为图式:<b>任务依赖 + Agent 间直接通信 + 并行执行</b>,2×0.5s 任务实测 <tag>0.51s</tag>',
      '跑通<b>能力插件化</b>(新增能力 = 注册一条,调度器零改动)与<b>模型服务化</b>(量化 30B 经 vLLM 服务化,编排与模型解耦)',
    ],
  },
  {
    icon: '✓',
    title: '评测与审阅 · 误差分账 + 独立审计',
    sub: 'LEAK-PROOF EVAL & DUAL AUDIT',
    points: [
      '防泄漏评测:评测题所涉论文<b>不进检索库</b>,留出题实测召回 <b>0%</b>,杜绝评测泄漏',
      '金证据 Oracle 对照 + <b>检索/回答分开计分</b>:名称题误差定位到生成端 → 押对齐训练;数字题瓶颈定位到检索端 → 查表解决',
      '<b>RAGAS + RAGChecker</b> 双框架交叉验证;裁判选型规程(弱裁判曾把忠实回答误判 0 分 → 固定最强裁判)',
      '自建 <b>LLM-as-judge</b>:出处可溯准确率 <up>20% → 98%</up>,<b>95% 置信区间</b>管理评测偶然性',
      '双独立审阅者审计:<b>199 条声明</b>核对、<b>13 处</b>修复、抓出 <b>1 个真实代码 bug</b>',
    ],
  },
]

export const ragPipeline = [
  { name: 'PDF 解析', note: '论文全文抽取' },
  { name: '语义切块', note: '按结构切块建索引' },
  { name: '双路召回', note: 'BM25 + bge-m3' },
  { name: '精排 top-4', note: 'CrossEncoder 重排' },
  { name: '三约束生成', note: '贪心解码 · 可复现' },
  { name: '数字查表', note: '指标-数字回溯原句' },
]

export const rlPipeline = [
  { name: 'SFT', note: '指令微调 (LoRA)', res: '引用率 13.6%→56.6%', warn: false },
  { name: 'merge', note: '权重合并', res: '能力保持', warn: false },
  { name: 'DPO', note: '偏好优化', res: '负收益 · 如实归因', warn: true },
  { name: 'GRPO', note: '强化学习对齐', res: '负收益 · 如实归因', warn: true },
  { name: '对照实验', note: '换基座 Qwen3-8B', res: '引用 98.2% / 数字 97.2%', warn: false },
]

/* ---------- Demo 预置问答 ---------- */

export interface DemoQA {
  id: string
  tag: string
  question: string
  trace: { agent: string; action: string; time: string }[]
  answer: string
  cites: { text: string; src: string }[]
}

export const demoQAs: DemoQA[] = [
  {
    id: 'q1',
    tag: '数字查表通道',
    question: 'LEVIR-CD 数据集上变化检测方法的 F1 最高是多少?哪个方法取得的?',
    trace: [
      { agent: 'orchestrator', action: '识别为「指标查询」意图 → 路由 Num-Table 通道', time: '0.02s' },
      { agent: 'num-table', action: '正则匹配「LEVIR-CD × F1」→ 命中 6 条指标记录', time: '0.04s' },
      { agent: 'num-table', action: '回溯原文原句校验,拒绝 LLM 数字回忆', time: '0.01s' },
      { agent: 'fusion', action: '融合 2 篇论文证据,生成对比表述', time: '0.18s' },
    ],
    answer:
      '根据语料库原文记录,LEVIR-CD 上报告的最高 F1 为 <strong>0.9129</strong>,由 FCCDN 取得;其采用特征约束 + 双注意力机制,在变化区域边缘细节上显著优于 FC-EF(F1 0.8283)与 BIT(F1 0.8931)。\n\n以上数字全部经「指标-数字」查表通道回溯原文原句校验,模型未参与数字生成。',
    cites: [
      { text: 'FCCDN: Feature Constraint on Change Detection Networks (F1 = 0.9129)', src: 'paper #037' },
      { text: 'BIT: Remote Sensing Image Change Detection with Transformers (F1 = 0.8931)', src: 'paper #052' },
    ],
  },
  {
    id: 'q2',
    tag: '混合检索 + 知识融合',
    question: '无监督变化检测相比有监督方法的核心优势和挑战是什么?',
    trace: [
      { agent: 'orchestrator', action: '识别为「概念对比」意图 → 路由 Retrieval + Fusion', time: '0.02s' },
      { agent: 'retrieval', action: 'BM25 + bge-m3 双路召回 → CrossEncoder 精排 top-4', time: '0.11s' },
      { agent: 'fusion', action: '跨 4 篇论文证据聚合,消除表述冲突', time: '0.22s' },
    ],
    answer:
      '核心优势:摆脱对<strong>人工标注双时相样本</strong>的依赖——标注成本是变化检测落地的主要瓶颈,无监督方法可利用海量未标注遥感影像训练。\n\n核心挑战:①伪标签噪声抑制,随机配对构造的伪样本存在分布偏移;②变化与季节/光照差异的解耦,模型易把成像差异误判为语义变化。\n\n以 Pair2Video 为代表的新思路是将检测重构为「变化视频」过程学习,在 LEVIR-CD 等 5 个公开基准上达到无监督 SOTA。',
    cites: [
      { text: 'Pair2Video: Zero-Annotation Remote Sensing Change Detection', src: 'paper #118' },
      { text: 'A Survey on Unsupervised Change Detection Methods', src: 'paper #009' },
    ],
  },
  {
    id: 'q3',
    tag: '图式并行调度',
    question: '帮我对比三篇论文的变化检测结果,并生成一段可放进报告的分析',
    trace: [
      { agent: 'orchestrator', action: '任务拆解为 2 个并行子任务 + 1 个依赖子任务(图式调度)', time: '0.03s' },
      { agent: 'retrieval × num-table', action: '并行执行:文本证据检索 ∥ 指标查表', time: '0.50s' },
      { agent: 'report', action: '依赖就绪后触发:生成报告级分析段落', time: '0.01s' },
    ],
    answer:
      '图式调度将「文本检索」与「数字查表」判定为无依赖并行任务,同 tick 触发;「报告生成」依赖两者输出,就绪后立即执行——三个任务墙钟耗时 <strong>0.51s</strong>(串行需 1.0s+)。\n\n生成段落:在 LEVIR-CD 基准上,FCCDN(0.9129)> BIT(0.8931)> FC-EF(0.8283)。三者差异主要源于对双时相特征交互的建模方式……',
    cites: [
      { text: '并行调度 trace:2 × 0.5s 任务实测 0.51s', src: 'self-test' },
      { text: '对比表格由 Num-Table 通道直出原文数字', src: 'trace log' },
    ],
  },
]

export const author = {
  name: '郭子健',
  role: 'LLM 算法工程师 · RAG / 多智能体 / 模型对齐',
  email: '1647365280@qq.com',
  edu: '北京林业大学 · 计算机科学与技术 硕士(GPA 3.8/4.0)',
}
