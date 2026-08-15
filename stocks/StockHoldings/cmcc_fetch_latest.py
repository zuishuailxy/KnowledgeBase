#!/usr/bin/env python3
"""
中国移动（600941，A股）最新财报抓取脚本（可复用）

功能：
  - 抓取最新报告期（自动识别，如 20260630 中报）财务摘要
  - 计算最新期 vs 去年同期（YoY）的关键指标
  - 抓取分红、最新股价（东财失败自动回退腾讯行情）
  - 输出原始数据 + 精简指标两份 JSON

用法（macOS）：
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
    .venv/bin/python cmcc_fetch_latest.py

输出：
  - cmcc_latest_refresh.json     原始数据
  - cmcc_latest_metrics.json     精简指标
"""

import json
import os
import re
from datetime import date
from pathlib import Path

import akshare as ak

os.environ["AKSHARE_TQDM_DISABLE"] = "1"

BASE = Path(__file__).resolve().parent
OUT = BASE / "cmcc_latest_refresh.json"
METRICS_OUT = BASE / "cmcc_latest_metrics.json"

SYMBOL = "600941"  # 中国移动 A 股
SECID = "1.600941"  # 东财 secid（1 = 沪市）
FALLBACK_PRICE = 97.71


def get_latest_price() -> float:
    """获取最新股价：先东财实时，失败回退腾讯行情，再失败用兜底价。"""
    # 方式 1：东财实时行情
    try:
        spot = ak.stock_zh_a_spot_em()
        row = spot[spot["代码"] == SYMBOL]
        if not row.empty:
            return float(row.iloc[0]["最新价"])
    except Exception:
        pass

    # 方式 2：腾讯行情（文本协议，稳定）
    try:
        import requests

        resp = requests.get(f"https://qt.gtimg.cn/q=sh{SYMBOL}", timeout=10)
        resp.encoding = "gbk"
        m = re.search(r'="([^"]+)"', resp.text)
        if m:
            fields = m.group(1).split("~")
            if len(fields) > 3:
                return float(fields[3])  # 字段[3] = 当前价
    except Exception:
        pass

    return FALLBACK_PRICE


def get_row(df: "pd.DataFrame", name: str):
    """按指标名取一行。"""
    return df[df["指标"].astype(str) == name]


def get_cell(df, name: str, period: str):
    """取某指标在某报告期的值（不存在返回 None）。"""
    row = get_row(df, name)
    if row.empty:
        return None
    return row.iloc[0].get(period)


def compute_annual_dps(fhps: "pd.DataFrame") -> dict:
    """按报告期年份汇总全年每股分红（元/股）。

    fhps 中「现金分红-现金分红比例」为每 10 股派息（元），除以 10 得每股。
    """
    dps = {}
    for _, row in fhps.iterrows():
        year = str(row["报告期"])[:4]
        per_share = float(row["现金分红-现金分红比例"] or 0) / 10.0
        dps[year] = dps.get(year, 0.0) + per_share
    return dps


def compute_ttm_dps(fhps: "pd.DataFrame"):
    """滚动 12 个月每股分红（元/股）：取最近两次分红之和。

    中国移动每年分两次（中期 + 末期），最近两次即覆盖最近 4 个季度。
    """
    if len(fhps) < 2:
        return None
    tail = fhps.tail(2)
    total = 0.0
    for _, row in tail.iterrows():
        total += float(row["现金分红-现金分红比例"] or 0) / 10.0
    return total


def main() -> None:
    print("拉取中国移动（600941）最新数据...")

    price = get_latest_price()
    fa = ak.stock_financial_abstract(symbol=SYMBOL)
    fhps = ak.stock_fhps_detail_em(symbol=SYMBOL)

    # 财务摘要列如 20260630 / 20260331 / 20251231 ...（8 位 YYYYMMDD，时间降序）
    period_cols = [c for c in fa.columns if re.fullmatch(r"\d{8}", str(c))]
    period_cols.sort(reverse=True)  # 保证最新在前
    latest = period_cols[0]
    prev = f"{int(latest[:4]) - 1}{latest[4:]}"  # 去年同期

    def read(metric: str):
        """返回 {最新期, 去年同期的值}，供 YoY 计算。"""
        return {
            "period": latest,
            "latest": get_cell(fa, metric, latest),
            "prev": get_cell(fa, metric, prev),
        }

    def yoy(v: dict):
        latest_v, prev_v = v["latest"], v["prev"]
        if latest_v is None or prev_v in (None, 0):
            return None
        return round((float(latest_v) / float(prev_v) - 1) * 100, 2)

    revenue = read("营业总收入")
    net_profit = read("归母净利润")
    roe = read("净资产收益率(ROE)")
    net_margin = read("销售净利率")
    gross_margin = read("销售毛利率")
    expense_ratio = read("期间费用率")
    debt_ratio = read("资产负债率")

    annual_dps = compute_annual_dps(fhps)
    ttm_dps = compute_ttm_dps(fhps)
    # 股息率用 TTM 口径（最近两次分红），与行情软件一致
    dividend_yield = (ttm_dps / price * 100) if ttm_dps else None

    metrics = {
        "symbol": SYMBOL,
        "as_of": str(date.today()),
        "price": price,
        "latest_period": latest,
        "prev_year_period": prev,
        "revenue": revenue,
        "revenue_yoy_pct": yoy(revenue),
        "net_profit": net_profit,
        "net_profit_yoy_pct": yoy(net_profit),
        "roe": roe,
        "net_margin": net_margin,
        "gross_margin": gross_margin,
        "expense_ratio": expense_ratio,
        "debt_ratio": debt_ratio,
        "annual_dps_by_year": annual_dps,
        "ttm_dps": ttm_dps,
        "dividend_yield_pct": dividend_yield,
    }

    payload = {
        "price": price,
        "latest_period": latest,
        "financial_abstract": fa.to_dict(orient="records"),
        "fhps_tail": fhps.tail(12).to_dict(orient="records"),
    }

    OUT.write_text(
        json.dumps(payload, ensure_ascii=False, default=str, indent=2), encoding="utf-8"
    )
    METRICS_OUT.write_text(
        json.dumps(metrics, ensure_ascii=False, default=str, indent=2), encoding="utf-8"
    )

    print(f"最新报告期: {latest}（去年同期: {prev}）")
    print(f"股价: {price}")
    print(f"营收: {metrics['revenue']['latest']}  同比: {metrics['revenue_yoy_pct']}%")
    print(
        f"归母净利: {metrics['net_profit']['latest']}  同比: {metrics['net_profit_yoy_pct']}%"
    )
    print(f"ROE: {metrics['roe']['latest']}  股息率: {metrics['dividend_yield_pct']}%")
    print(f"已保存: {OUT.name} / {METRICS_OUT.name}")


if __name__ == "__main__":
    main()
