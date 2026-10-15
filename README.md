# RS-Agent · 项目展示页

遥感变化检测多智能体专家系统(RS-Agent)的面试展示前端,深色科技感单页应用。

## 技术栈

React 18 + TypeScript + Vite,零 UI 库依赖(全部手写 CSS/动画),构建产物 gzip ≈ 55KB。

## 运行

```bash
pnpm install
pnpm dev        # http://127.0.0.1:5173/
```

## 实机演示通道(可选,面试现场真跑)

展示页「实机演示」Tab 连接本地 FastAPI 后端:**真实检索**(120 篇论文摘要 BM25 + 8657 条指标库查表)+ **真实 LLM API** 编排生成(任意 OpenAI 兼容接口)。

```bash
cd server
cp .env.example .env   # 填入 OPENAI_API_KEY / OPENAI_API_BASE / DEMO_MODEL
./run.sh               # 监听 127.0.0.1:8790
```

链路:问题 → LLM 意图路由(自实现 tool_call 协议)→ 真实工具执行 → LLM 基于证据生成 → trace + 引用。
API Key 仅存服务端 `.env`(已 gitignore),不进入前端代码。GitHub Pages 线上版不含此通道。

## 构建与部署

```bash
pnpm build      # 输出 dist/
pnpm preview    # 本地预览构建产物
```

部署:把 `dist/` 丢到任意静态托管(Vercel / Netlify / GitHub Pages)即可。

## 页面结构

| 区块 | 内容 |
| --- | --- |
| Hero | 项目定位 + 雷达扫描视觉 + 技术栈 |
| Metrics | 5 项核心指标数字滚动(120 篇语料 / 6 Agent / 97.2% 数字忠实 / 98.2% 引用率 / 0.51s 并行调度) |
| Architecture | SVG 架构图:编排者-工作者 + MCP 工具层 + 数据层,星型→图型升级对比 |
| Features | 四大技术模块:RAG 混合检索 / RL 对齐全链路 / 多 Agent 协同 / 评测与审计 |
| Pipeline | RAG 链路与 RL 链路步骤图 |
| Demo | 模拟问答:调度轨迹逐行展示 + 打字机回答 + 引用溯源,支持 3 个预置问题切换与重播 |

## 备注

- 所有内容数据集中在 `src/data.ts`,改文案只动这一个文件。
- 访问 `http://127.0.0.1:5173/?flat` 进入无动画平面模式(用于整页截图)。
- Demo 区为静态展示版,问答与调度轨迹基于真实系统设计预置。
