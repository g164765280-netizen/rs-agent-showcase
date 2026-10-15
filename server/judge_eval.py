# -*- coding: utf-8 -*-
"""LLM-as-judge 盲评:非数字题 A(本地RAG) vs C+(联网+思考)

防偏见设计:隐去来源标签、随机交换左右位置、裁判为生成同模型(两边回答同出 deepseek-v4-flash,偏差对等)、关思考提速。
"""
from __future__ import annotations

import asyncio
import json
import random
import re
from pathlib import Path

from main import llm

HERE = Path(__file__).parent
ROWS = json.loads((HERE / "compare_report_v2.json").read_text(encoding="utf-8"))

JUDGE_SYS = """你是严格、公正的学术回答评审。给定一个问题和两个匿名回答(回答X / 回答Y),按四个维度各打 1-5 分:
- evidence:证据忠实度(论断是否有来源支撑,而非泛泛而谈)
- depth:信息深度(机制解释、细节丰富度)
- structure:结构清晰度(条理、分点、易读)
- utility:实用价值(对研究者的可操作性)

只输出 JSON,不要输出其他内容:
{"x": {"evidence": n, "depth": n, "structure": n, "utility": n}, "y": {...}, "winner": "X|Y|tie", "reason": "一句话理由"}"""

async def judge(q: str, a: str, b: str, flip: bool):
    x, y = (b, a) if flip else (a, b)  # flip=True 时 X=C+, Y=A
    out = await llm(
        [{"role": "system", "content": JUDGE_SYS},
         {"role": "user", "content": f"问题:{q}\n\n【回答X】\n{x}\n\n【回答Y】\n{y}"}],
        max_tokens=1200,
    )
    m = re.search(r"\{.*\}", out, re.DOTALL)
    d = json.loads(m.group(0))
    # 归一化回 A/C 视角
    if flip:
        d["x"], d["y"] = d["y"], d["x"]
        d["winner"] = {"X": "C", "Y": "A", "tie": "tie"}[d["winner"]]
    else:
        d["winner"] = {"X": "A", "Y": "C", "tie": "tie"}[d["winner"]]
    return d

async def main():
    random.seed(42)
    results = []
    for r in ROWS:
        if r["type"] == "numeric":
            continue
        if not (r.get("A", {}).get("ok") and r.get("C", {}).get("ok")):
            continue
        flip = random.random() < 0.5
        try:
            d = await judge(r["q"], r["A"]["answer"], r["C"]["answer"], flip)
            d.update({"id": r["id"], "type": r["type"], "flip": flip})
            results.append(d)
            wa = sum(d["x"].values()); wc = sum(d["y"].values())
            print(f"[{r['id']}] A={wa} C+={wc} winner={d['winner']} ({d['reason'][:40]})", flush=True)
        except Exception as e:
            print(f"[{r['id']}] judge fail: {e}", flush=True)
        await asyncio.sleep(0.2)

    dims = ["evidence", "depth", "structure", "utility"]
    print("\n=== 维度均分(1-5) ===")
    for dim in dims:
        ma = sum(r["x"][dim] for r in results) / len(results)
        mc = sum(r["y"][dim] for r in results) / len(results)
        print(f"  {dim:10s}  A(本地RAG) {ma:.2f}  vs  C+(联网+思考) {mc:.2f}")
    wins = {"A": 0, "C": 0, "tie": 0}
    for r in results:
        wins[r["winner"]] += 1
    print(f"\n胜负: A 胜 {wins['A']} / C+ 胜 {wins['C']} / 平 {wins['tie']}  (共 {len(results)} 题)")
    (HERE / "judge_report.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print("✓ judge_report.json 已生成")

if __name__ == "__main__":
    asyncio.run(main())
