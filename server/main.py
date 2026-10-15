# -*- coding: utf-8 -*-
"""RS-Agent 实机演示后端

链路:用户问题 → LLM 意图路由(自实现 tool_call 协议) → 真实工具执行
      (BM25 论文摘要检索 / 指标库查表) → LLM 基于证据生成 → trace + answer + cites

数据:120 篇遥感论文摘要 + 8657 条指标记录(与正式系统同一语料)。
模型:OpenAI 兼容 API,环境变量 OPENAI_API_KEY / OPENAI_API_BASE / DEMO_MODEL。
"""
from __future__ import annotations

import json
import math
import os
import re
import time
from pathlib import Path

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATA = Path(__file__).parent / "data"

# ---------------------------------------------------------------- 数据加载

def _load_jsonl(p: Path):
    return [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]

PAPERS = _load_jsonl(DATA / "metadata_abstracts.jsonl")
METRICS = _load_jsonl(DATA / "metric_library.jsonl")

# ---------------------------------------------------------------- BM25(纯 Python Okapi)

def tokenize(text: str):
    text = text.lower()
    en = re.findall(r"[a-z0-9][a-z0-9\-\_\.]*", text)
    zh = re.findall(r"[一-鿿]", text)
    return en + zh  # 中文按单字,英文按词

class BM25:
    def __init__(self, docs, k1=1.5, b=0.75):
        self.k1, self.b = k1, b
        self.docs = docs
        self.doc_tokens = [tokenize(d) for d in docs]
        self.doc_len = [len(t) for t in self.doc_tokens]
        self.avgdl = sum(self.doc_len) / max(len(self.doc_len), 1)
        self.df = {}
        for toks in self.doc_tokens:
            for t in set(toks):
                self.df[t] = self.df.get(t, 0) + 1
        self.N = len(docs)

    def _idf(self, t):
        n = self.df.get(t, 0)
        return math.log(1 + (self.N - n + 0.5) / (n + 0.5))

    def search(self, query: str, top_k=3):
        q = tokenize(query)
        scores = []
        for i, toks in enumerate(self.doc_tokens):
            tf = {}
            for t in toks:
                tf[t] = tf.get(t, 0) + 1
            s = 0.0
            for t in q:
                if t not in tf:
                    continue
                f = tf[t]
                s += self._idf(t) * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * self.doc_len[i] / self.avgdl))
            scores.append(s)
        order = sorted(range(len(scores)), key=lambda i: -scores[i])
        return [(i, scores[i]) for i in order[:top_k] if scores[i] > 0]

CORPUS_TEXT = [f"{p['title']}. {p['abstract']}" for p in PAPERS]
bm25 = BM25(CORPUS_TEXT)

# ---------------------------------------------------------------- LLM 客户端

API_KEY = os.environ.get("OPENAI_API_KEY", "")
API_BASE = os.environ.get("OPENAI_API_BASE", "https://api.deepseek.com").rstrip("/")
MODEL = os.environ.get("DEMO_MODEL", "deepseek-chat")

async def llm(messages, max_tokens=4096, thinking=False, return_usage=False):
    if not API_KEY:
        raise RuntimeError("NO_API_KEY")
    last_err: Exception | None = None
    payload = {
        "model": MODEL,
        "messages": messages,
        "temperature": 0,
        "max_tokens": max_tokens,
    }
    if not thinking:
        # 演示场景默认关闭思考链(思考会随机拖慢到 40-60s);评测 C 组时开启
        payload["thinking"] = {"type": "disabled"}
    # 共享网关偶发排队/超时:收紧超时 + 重试一次
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=180) as cli:
                r = await cli.post(
                    f"{API_BASE}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {API_KEY}",
                        # 部分网关按 UA 拦截 python 客户端,伪装浏览器
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
                    },
                    json=payload,
                )
                r.raise_for_status()
                d = r.json()
                content = d["choices"][0]["message"]["content"].strip()
                if return_usage:
                    return content, d.get("usage", {})
                return content
        except Exception as e:
            last_err = e
    raise last_err or RuntimeError("llm call failed")

# ---------------------------------------------------------------- 编排

ROUTER_SYSTEM = """你是 RS-Agent 的编排器(Orchestrator)。根据用户问题选择恰好一个工具,只输出工具调用,不要输出其他内容。

可用工具:
- search_papers:检索遥感变化检测论文(摘要级),回答概念/方法/对比类问题。参数 query 必须是英文检索词组。
- lookup_metric:查询某数据集上各方法的指标数值(如 F1/IoU/OA)。参数 dataset 用标准名(如 LEVIR-CD、WHU-CD、GZ-CD、CDD、SYSU-CD),metric 默认 F1。

输出格式(严格遵守):
<tool_call>{"name": "search_papers", "arguments": {"query": "unsupervised change detection diffusion"}}</tool_call>
或
<tool_call>{"name": "lookup_metric", "arguments": {"dataset": "LEVIR-CD", "metric": "F1"}}</tool_call>"""

GEN_SYSTEM = """你是遥感变化检测论文问答助手。严格基于给定证据回答,逐条标注引用编号[n]。
要求:中文回答(论文专有名词保留英文);数字必须照抄证据,不得臆造;证据不足就说"基于现有语料无法确定"。回答控制在 200 字以内,精炼专业。"""

def parse_tool_call(text: str):
    m = re.search(r"<tool_call>\s*(\{.*?\})\s*</tool_call>", text, re.DOTALL) or re.search(r"(\{\s*\"name\".*?\})", text, re.DOTALL)
    if m:
        try:
            d = json.loads(m.group(1))
            return d.get("name"), d.get("arguments", {})
        except Exception:
            pass
    return None, None

def tool_search_papers(query: str, top_k=3):
    hits = bm25.search(query, top_k=top_k)
    evidences, cites = [], []
    for rank, (i, score) in enumerate(hits):
        p = PAPERS[i]
        evidences.append(f"[{rank+1}] {p['title']} ({p.get('year','')}): {p['abstract'][:600]}")
        cites.append({"text": p["title"], "src": f"arXiv:{p['arxiv_id']} · {p.get('year','')}"})
    return evidences, cites, len(hits)

DATASET_ALIAS = {
    "levir": "LEVIR-CD", "whu": "WHU-CD", "gz": "GZ-CD", "cdd": "CDD",
    "sysu": "SYSU-CD", "second": "SECOND", "hrscd": "HRSCD", "s2looking": "S2Looking",
}

def _num(v: str):
    try:
        return float(str(v).replace("%", ""))
    except Exception:
        return None

def tool_lookup_metric(dataset: str, metric: str = "F1"):
    ds = dataset.strip().lower().replace("-cd", "").replace("cd", "").strip("- ")
    ds_key = DATASET_ALIAS.get(ds, dataset).lower()
    hits = []
    for r in METRICS:
        if ds_key in str(r.get("dataset", "")).lower() and metric.lower() in str(r.get("metric", "")).lower():
            n = _num(r.get("value"))
            if n is not None:
                hits.append((n, r))
    hits.sort(key=lambda x: -x[0])
    evidences, cites = [], []
    seen = set()
    rank = 0
    for n, r in hits:
        key = (r.get("method"), r.get("dataset"))
        if key in seen or rank >= 5:
            continue
        seen.add(key)
        rank += 1
        paper = next((p for p in PAPERS if p["arxiv_id"] == r.get("paper_id")), None)
        title = paper["title"] if paper else f"arXiv:{r.get('paper_id')}"
        evidences.append(f"[{rank}] 方法 {r.get('method')} 在 {r.get('dataset')} 上 {r.get('metric')} = {r.get('value')}(来源:{title})")
        cites.append({"text": f"{r.get('method')} · {r.get('dataset')} {metric}={r.get('value')}", "src": f"arXiv:{r.get('paper_id')}"})
    return evidences, cites, len(hits)

# ---------------------------------------------------------------- API

app = FastAPI(title="RS-Agent Live Demo")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatReq(BaseModel):
    question: str

@app.get("/api/health")
def health():
    return {
        "ok": True,
        "has_api_key": bool(API_KEY),
        "model": MODEL,
        "papers": len(PAPERS),
        "metrics": len(METRICS),
    }


@app.on_event("startup")
async def warmup():
    """启动后预热网关链路,避免首次演示撞上冷连接。"""
    if not API_KEY:
        return
    import asyncio

    async def _warm():
        try:
            await llm([{"role": "user", "content": "ping"}], max_tokens=8)
        except Exception:
            pass

    asyncio.create_task(_warm())

@app.post("/api/chat")
async def chat(req: ChatReq):
    q = req.question.strip()
    if not q:
        return {"ok": False, "error": "empty question"}
    if not API_KEY:
        return {"ok": False, "error": "no_api_key"}
    trace = []

    # 1) 意图路由(LLM)
    t0 = time.perf_counter()
    try:
        router_out = await llm(
            [{"role": "system", "content": ROUTER_SYSTEM}, {"role": "user", "content": q}],
            max_tokens=300,
        )
    except Exception as e:
        return {"ok": False, "error": f"llm_router: {e}"}
    name, args = parse_tool_call(router_out)
    dt = time.perf_counter() - t0

    # 规则兜底:路由失败时按关键词选择工具
    if not name:
        if re.search(r"f1|iou|指标|最高|多少|对比.*(方法|结果)", q, re.I) and re.search(r"levir|whu|gz|cdd|sysu|second|hrscd", q, re.I):
            name, args = "lookup_metric", {"dataset": re.search(r"(levir|whu|gz|cdd|sysu|second|hrscd)[\-\s]?c?d?", q, re.I).group(0), "metric": "F1"}
        else:
            name, args = "search_papers", {"query": q}
        trace.append({"agent": "orchestrator", "action": "LLM 路由未命中格式 → 关键词规则兜底", "time": f"{dt:.2f}s"})
    else:
        tool_cn = "数字查表通道" if name == "lookup_metric" else "论文检索通道"
        trace.append({"agent": "orchestrator", "action": f"意图路由 → {name}({tool_cn})", "time": f"{dt:.2f}s"})

    # 2) 工具执行(真实检索/查表)
    t1 = time.perf_counter()
    if name == "lookup_metric":
        evidences, cites, n_hit = tool_lookup_metric(args.get("dataset", ""), args.get("metric", "F1"))
        trace.append({
            "agent": "num-table",
            "action": f"指标库检索 {args.get('dataset','?')} × {args.get('metric','F1')} → 命中 {n_hit} 条,取 top-{len(evidences)}",
            "time": f"{time.perf_counter()-t1:.2f}s",
        })
    else:
        query_en = args.get("query", q)
        evidences, cites, n_hit = tool_search_papers(query_en)
        action = f"BM25 召回 top-{len(evidences)}"
        if re.search(r"[一-鿿]", q) and query_en != q:
            action = f"查询改写:「{q[:18]}…」→「{query_en}」;BM25 召回 top-{len(evidences)}"
        trace.append({"agent": "retrieval", "action": action, "time": f"{time.perf_counter()-t1:.2f}s"})

    if not evidences:
        return {
            "ok": True,
            "trace": trace,
            "answer": "在当前语料库(120 篇遥感变化检测论文摘要级索引)中未检索到相关证据,基于现有语料无法可靠回答该问题。",
            "cites": [],
        }

    # 3) 证据生成(LLM)
    t2 = time.perf_counter()
    ev_text = "\n\n".join(evidences)
    try:
        answer = await llm(
            [{"role": "system", "content": GEN_SYSTEM},
             {"role": "user", "content": f"问题:{q}\n\n证据:\n{ev_text}"}],
            max_tokens=800,
        )
    except Exception as e:
        return {"ok": False, "error": f"llm_gen: {e}"}
    trace.append({"agent": "fusion", "action": f"基于 {len(evidences)} 条证据生成回答(温度 0,可复现)", "time": f"{time.perf_counter()-t2:.2f}s"})

    return {"ok": True, "trace": trace, "answer": answer, "cites": cites}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8790)
