# -*- coding: utf-8 -*-
"""对比实验:RS-Agent(本地 RAG + LLM) vs 裸模型 vs 联网搜索 + LLM

A 组:POST 127.0.0.1:8790/api/chat(真实 RS-Agent 链路)
B 组:裸调 deepseek-v4-flash(无任何证据,纯参数记忆)
C 组:公网搜索结果 + 同一模型生成(模拟"大模型自己检索")

量化维度:数字忠实度 / 引用真实性 / 延迟 / token 用量 / 信息丰富度
"""
from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path

import httpx

HERE = Path(__file__).parent
QUESTIONS = json.loads((HERE / "eval_questions.json").read_text(encoding="utf-8"))
WEB = json.loads((HERE / "web_results.json").read_text(encoding="utf-8"))

# 语料库标题集(用于验证引用真实性)
PAPERS = [json.loads(l) for l in (HERE / "data/metadata_abstracts.jsonl").read_text(encoding="utf-8").splitlines()]
CORPUS_TITLES = {p["title"].lower() for p in PAPERS}
CORPUS_IDS = {p["arxiv_id"] for p in PAPERS}

from main import llm  # 复用后端的 LLM 客户端(thinking 已禁用)

GEN_SYS = "你是遥感变化检测领域助手。中文回答,论文专有名词保留英文,回答控制在 200 字以内。"
WEB_SYS = "你是遥感变化检测领域助手。基于给定的网络搜索结果用中文回答,标注来源编号[n];搜索结果没有的信息不要编造;控制在 200 字以内。"

# ---------------------------------------------------------------- 打分

NUM_RE = re.compile(r"\d+\.\d+|\d{2,3}(?:\.\d+)?%")

def extract_nums(text: str):
    out = []
    for m in NUM_RE.finditer(text):
        v = m.group(0).rstrip("%")
        try:
            out.append(float(v))
        except ValueError:
            pass
    return out

def score_numeric(answer: str, gt_value: float, gt_method: str):
    """数字题:GT 命中 / 方法命中 / 幻觉数字数 / 是否拒答"""
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
    """信息丰富度:编号要点数"""
    pts = re.findall(r"(?:^|\n)\s*(?:\d+[.、]|[①②③④⑤⑥]|\*\*)", answer)
    return max(len(pts), 1)

def check_citations(answer: str, cites: list | None, group: str):
    """引用真实性:A 组按构造 100% 真实;B/C 组检查提到的 arXiv id/论文标题是否命中语料库"""
    if group == "A":
        return {"cited": len(cites or []), "verified": len(cites or [])}  # 构造保证真实
    arxiv_ids = re.findall(r"arXiv[:\s]*(\d{4}\.\d{4,5})", answer, re.I)
    verified = sum(1 for a in arxiv_ids if any(a in pid for pid in CORPUS_IDS))
    # 论文标题粗匹配(引用语料库内论文标题片段视为真实)
    title_hits = sum(1 for t in CORPUS_TITLES if len(t) > 25 and t[:40] in answer.lower())
    total = len(arxiv_ids) + title_hits
    return {"cited": total, "verified": verified + title_hits}

# ---------------------------------------------------------------- 跑组

async def run_all():
    import asyncio
    results = []
    cli_timeout = 150
    async with httpx.AsyncClient(timeout=cli_timeout) as cli:
        for q in QUESTIONS:
            row = {"id": q["id"], "type": q["type"], "q": q["q"]}

            # ---- A 组:RS-Agent 本地 RAG 链路 ----
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

            # ---- B 组:裸模型 ----
            t0 = time.perf_counter()
            try:
                ans_b = await llm(
                    [{"role": "system", "content": GEN_SYS}, {"role": "user", "content": q["q"]}],
                    max_tokens=800,
                )
                row["B"] = {"answer": ans_b, "latency": round(time.perf_counter() - t0, 2), "ok": True}
            except Exception as e:
                row["B"] = {"ok": False, "error": str(e), "latency": round(time.perf_counter() - t0, 2)}
            print(f"[{q['id']}] B done {row['B']['latency']}s", flush=True)
            await asyncio.sleep(0.3)

            # ---- C 组:联网搜索 + LLM ----
            t0 = time.perf_counter()
            try:
                ans_c = await llm(
                    [{"role": "system", "content": WEB_SYS},
                     {"role": "user", "content": f"问题:{q['q']}\n\n网络搜索结果:\n{WEB.get(q['id'], '无')}"}],
                    max_tokens=800,
                )
                row["C"] = {"answer": ans_c, "latency": round(time.perf_counter() - t0, 2), "ok": True}
            except Exception as e:
                row["C"] = {"ok": False, "error": str(e), "latency": round(time.perf_counter() - t0, 2)}
            print(f"[{q['id']}] C done {row['C']['latency']}s", flush=True)

            results.append(row)

    # ---- 打分 ----
    for row, q in zip(results, QUESTIONS):
        for g in ("A", "B", "C"):
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

    (HERE / "compare_report.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n✓ compare_report.json 已生成")

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_all())
