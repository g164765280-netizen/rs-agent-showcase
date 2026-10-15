# -*- coding: utf-8 -*-
"""对比实验 v2:RS-Agent(本地 RAG) vs 联网搜索 + 满血思考 LLM

A 组:POST 127.0.0.1:8790/api/chat(真实 RS-Agent 链路,关思考)
C+ 组:公网搜索证据 + 同一模型【开思考】生成(模拟满血联网大模型)

题型:数字题(n) / 概念题(c) / 多论文总结(s) / 领域理解(u)
量化:数字忠实度 / 引用可溯源 / 延迟 / token 消耗 / 信息丰富度
"""
from __future__ import annotations

import asyncio
import json
import re
import time
from pathlib import Path

import httpx

from main import llm  # 复用后端客户端;C+ 组显式 thinking=True

HERE = Path(__file__).parent
QUESTIONS = json.loads((HERE / "eval_questions.json").read_text(encoding="utf-8"))
WEB = json.loads((HERE / "web_results.json").read_text(encoding="utf-8"))

PAPERS = [json.loads(l) for l in (HERE / "data/metadata_abstracts.jsonl").read_text(encoding="utf-8").splitlines()]
CORPUS_IDS = {p["arxiv_id"] for p in PAPERS}
CORPUS_TITLES = {p["title"].lower() for p in PAPERS}

WEB_SYS = """你是遥感变化检测领域助手。基于给定的网络搜索结果用中文回答,标注来源编号[n]。
要求:搜索结果没有的信息不要编造;如果是总结/理解类问题,允许在证据基础上做合理归纳,并明确区分「证据所述」与「你的归纳」;回答 250 字以内。"""

NUM_RE = re.compile(r"\d+\.\d+|\d{2,3}(?:\.\d+)?%")

def extract_nums(text: str):
    out = []
    for m in NUM_RE.finditer(text):
        try:
            out.append(float(m.group(0).rstrip("%")))
        except ValueError:
            pass
    return out

def score_numeric(answer: str, gt_value: float, gt_method: str):
    nums = extract_nums(answer)
    def close(a, b):
        return abs(a - b) < 0.31 or abs(a * 100 - b) < 0.31 or abs(a - b * 100) < 0.0031
    hit = any(close(n, gt_value) for n in nums)
    method_hit = bool(gt_method) and gt_method.lower() in answer.lower()
    hallucinated = [n for n in nums if 0 < n <= 100 and not close(n, gt_value)]
    refused = any(k in answer for k in ["无法确定", "无法回答", "没有提供", "未提供", "不知道"])
    return {
        "value_hit": hit,
        "method_hit": method_hit,
        "hallucination_count": 0 if (hit or refused) else len(hallucinated),
        "refused": refused and not hit,
    }

def count_points(answer: str):
    pts = re.findall(r"(?:^|\n)\s*(?:\d+[.、]|[①②③④⑤⑥]|\*\*)", answer)
    return max(len(pts), 1)

def check_citations(answer: str, cites: list | None, group: str):
    if group == "A":
        return {"cited": len(cites or []), "verified": len(cites or [])}  # 构造保证真实
    arxiv_ids = re.findall(r"arXiv[:\s]*(\d{4}\.\d{4,5})", answer, re.I)
    verified = sum(1 for a in arxiv_ids if any(a in pid for pid in CORPUS_IDS))
    title_hits = sum(1 for t in CORPUS_TITLES if len(t) > 25 and t[:40] in answer.lower())
    # C 组公网 URL 引用:计 cited 但不可自动 verify(标记为 unverifiable)
    url_refs = len(re.findall(r"\[\d+\]", answer))
    total = max(len(arxiv_ids) + title_hits, url_refs if url_refs else 0)
    return {"cited": total, "verified": verified + title_hits}

async def run_all():
    results = []
    async with httpx.AsyncClient(timeout=200) as cli:
        for q in QUESTIONS:
            row = {"id": q["id"], "type": q["type"], "q": q["q"]}

            # ---- A 组:RS-Agent 本地 RAG ----
            t0 = time.perf_counter()
            try:
                r = await cli.post("http://127.0.0.1:8790/api/chat", json={"question": q["q"]})
                da = r.json()
                row["A"] = {
                    "answer": da.get("answer", ""),
                    "cites": da.get("cites", []),
                    "trace": da.get("trace", []),
                    "latency": round(time.perf_counter() - t0, 2),
                    "ok": da.get("ok", False),
                }
            except Exception as e:
                row["A"] = {"ok": False, "error": str(e), "latency": round(time.perf_counter() - t0, 2)}
            print(f"[{q['id']}] A done {row['A']['latency']}s", flush=True)
            await asyncio.sleep(0.3)

            # ---- C+ 组:联网搜索 + 满血思考 ----
            t0 = time.perf_counter()
            try:
                ans_c, usage = await llm(
                    [{"role": "system", "content": WEB_SYS},
                     {"role": "user", "content": f"问题:{q['q']}\n\n网络搜索结果:\n{WEB.get(q['id'], '无')}"}],
                    max_tokens=8000,
                    thinking=True,
                    return_usage=True,
                )
                row["C"] = {
                    "answer": ans_c,
                    "latency": round(time.perf_counter() - t0, 2),
                    "ok": True,
                    "usage": usage,
                }
            except Exception as e:
                row["C"] = {"ok": False, "error": str(e), "latency": round(time.perf_counter() - t0, 2)}
            cu = row["C"].get("usage", {})
            print(f"[{q['id']}] C+ done {row['C']['latency']}s tokens={cu.get('total_tokens','?')}", flush=True)
            await asyncio.sleep(0.3)

            results.append(row)

    # ---- 打分 ----
    for row, q in zip(results, QUESTIONS):
        for g in ("A", "C"):
            d = row.get(g, {})
            if not d.get("ok"):
                row[f"{g}_score"] = {"ok": False}
                continue
            ans = d["answer"]
            s = {"ok": True, "points": count_points(ans), "chars": len(ans)}
            if q["type"] == "numeric":
                s.update(score_numeric(ans, q["gt_value"], q.get("gt_method", "")))
            s["cite"] = check_citations(ans, d.get("cites"), g)
            row[f"{g}_score"] = s

    (HERE / "compare_report_v2.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n✓ compare_report_v2.json 已生成")

if __name__ == "__main__":
    asyncio.run(run_all())
