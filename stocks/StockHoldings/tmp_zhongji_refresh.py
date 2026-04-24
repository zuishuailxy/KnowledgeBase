import json
import os
import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import akshare as ak
import pandas as pd
import requests
from pypdf import PdfReader


os.environ["AKSHARE_TQDM_DISABLE"] = "1"

BASE_DIR = Path(__file__).resolve().parent
PDF_PATH = BASE_DIR / "zhongji_2024.pdf"
LATEST_OUT = BASE_DIR / "zhongji_latest_refresh.json"
METRICS_OUT = BASE_DIR / "zhongji_metrics.json"
SNIPPETS_OUT = BASE_DIR / "zhongji_2024_snippets.txt"


def load_existing_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def as_float(value) -> float:
    if pd.isna(value):
        return 0.0
    return float(value)


def cagr(start_value: float, end_value: float, years: int) -> float:
    if start_value <= 0 or end_value <= 0 or years <= 0:
        return 0.0
    return (end_value / start_value) ** (1 / years) - 1


def find_metric(df: pd.DataFrame, keyword: str) -> pd.Series:
    mask = df["指标"].astype(str).str.contains(keyword, na=False)
    matched = df[mask]
    if matched.empty:
        raise KeyError(f"metric not found: {keyword}")
    return matched.iloc[0]


def make_json_safe(records: list[dict]) -> list[dict]:
    safe_records = []
    for record in records:
        safe_record = {}
        for key, value in record.items():
            if isinstance(value, pd.Timestamp):
                safe_record[key] = value.strftime("%Y-%m-%d")
            elif hasattr(value, "isoformat") and not isinstance(value, (str, bytes, int, float, bool)):
                safe_record[key] = value.isoformat()
            else:
                safe_record[key] = None if pd.isna(value) else value
        safe_records.append(safe_record)
    return safe_records


def disclosure_pdf_url(detail_url: str) -> str:
    parsed = urlparse(detail_url)
    query = parse_qs(parsed.query)
    announcement_id = query["announcementId"][0]
    announcement_time = query["announcementTime"][0]
    return f"http://static.cninfo.com.cn/finalpage/{announcement_time}/{announcement_id}.PDF"


def extract_pdf_text(url: str, target: Path) -> str:
    if not target.exists():
        response = requests.get(url, timeout=90)
        response.raise_for_status()
        target.write_bytes(response.content)
    reader = PdfReader(str(target))
    return "".join(page.extract_text() or "" for page in reader.pages)


def extract_snippet(text: str, keyword: str, span: int = 260) -> str | None:
    index = text.find(keyword)
    if index < 0:
        return None
    start = max(0, index - 120)
    end = min(len(text), index + span)
    return text[start:end]


def main() -> None:
    existing_metrics = load_existing_json(METRICS_OUT)

    fa = ak.stock_financial_abstract(symbol="605305")
    bs = ak.stock_balance_sheet_by_report_em(symbol="SH605305")
    cf = ak.stock_cash_flow_sheet_by_report_em(symbol="SH605305")
    fhps = ak.stock_fhps_detail_em(symbol="605305")

    try:
        spot = ak.stock_zh_a_spot()
        code_col = spot.columns[0]
        row = spot[spot[code_col].astype(str).str.contains("605305", na=False)].iloc[0]
        price = as_float(row.iloc[2])
        price_time = str(row.iloc[-1])
        price_date = "2026-04-13"
        price_source = "spot"
        price_row = row.to_dict()
    except Exception:
        price = as_float(existing_metrics.get("price", 45.66))
        price_time = str(existing_metrics.get("price_time", "10:36:00"))
        price_date = str(existing_metrics.get("price_date", "2026-04-13"))
        price_source = str(existing_metrics.get("price_source", "spot"))
        price_row = {
            "代码": "sh605305",
            "名称": "中际联合",
            "最新价": price,
            "时间": price_time,
        }

    try:
        disclosures = ak.stock_zh_a_disclosure_report_cninfo(
            symbol="605305",
            category="年报",
            start_date="20250301",
            end_date="20260415",
        )
        annual_row = disclosures[disclosures["公告标题"].astype(str).str.contains("2024年年度报告", na=False)]
        annual_row = annual_row[~annual_row["公告标题"].astype(str).str.contains("摘要", na=False)].iloc[0]
        pdf_url = disclosure_pdf_url(str(annual_row["公告链接"]))
    except Exception:
        pdf_url = str(existing_metrics.get("annual_report_pdf_url", "http://static.cninfo.com.cn/finalpage/2025-04-19/1223142895.PDF"))

    report_text = extract_pdf_text(pdf_url, PDF_PATH)
    normalized_text = re.sub(r"\s+", "", report_text)

    bs_annual = bs[bs["REPORT_TYPE"] == "年报"].sort_values("REPORT_DATE").tail(5).copy()
    cf_annual = cf[cf["REPORT_TYPE"] == "年报"].sort_values("REPORT_DATE").tail(5).copy()

    annual_years = ["20201231", "20211231", "20221231", "20231231", "20241231"]

    roe_row = find_metric(fa, r"净资产收益率\(ROE\)")
    revenue_row = find_metric(fa, "营业总收入")
    profit_row = find_metric(fa, "归母净利润")
    ocf_row = find_metric(fa, "经营现金流量净额")
    eps_row = find_metric(fa, "基本每股收益")
    bps_row = find_metric(fa, "每股净资产")
    gross_margin_row = find_metric(fa, "毛利率")
    net_margin_row = find_metric(fa, "销售净利率")
    expense_row = find_metric(fa, "期间费用率")
    revenue_growth_row = find_metric(fa, "营业总收入增长率")

    roe_values = [round(as_float(roe_row[year]), 2) for year in annual_years]
    revenue_map = {year[:4]: as_float(revenue_row[year]) for year in annual_years}
    profit_map = {year[:4]: as_float(profit_row[year]) for year in annual_years}
    ocf_map = {year[:4]: as_float(ocf_row[year]) for year in annual_years}
    eps_map = {year[:4]: as_float(eps_row[year]) for year in annual_years}
    bps_map = {year[:4]: as_float(bps_row[year]) for year in annual_years}

    revenue_2025q3 = as_float(revenue_row.get("20250930", 0.0))
    revenue_2024q3 = as_float(revenue_row.get("20240930", 0.0))
    profit_2025q3 = as_float(profit_row.get("20250930", 0.0))
    profit_2024q3 = as_float(profit_row.get("20240930", 0.0))
    eps_2025q3 = as_float(eps_row.get("20250930", 0.0))
    eps_2024q3 = as_float(eps_row.get("20240930", 0.0))
    ocf_2025q3 = as_float(ocf_row.get("20250930", 0.0))
    ocf_2024q3 = as_float(ocf_row.get("20240930", 0.0))

    ttm_revenue = revenue_2025q3 + revenue_map["2024"] - revenue_2024q3 if revenue_2024q3 else revenue_map["2024"]
    ttm_profit = profit_2025q3 + profit_map["2024"] - profit_2024q3 if profit_2024q3 else profit_map["2024"]
    ttm_eps = eps_2025q3 + eps_map["2024"] - eps_2024q3 if eps_2024q3 else eps_map["2024"]
    ttm_ocf = ocf_2025q3 + ocf_map["2024"] - ocf_2024q3 if ocf_2024q3 else ocf_map["2024"]

    latest_bs = bs_annual.iloc[-1]
    total_assets = as_float(latest_bs["TOTAL_ASSETS"])
    total_liabilities = as_float(latest_bs["TOTAL_LIABILITIES"])
    equity = total_assets - total_liabilities
    cash = as_float(latest_bs["MONETARYFUNDS"])
    accounts_receivable = as_float(latest_bs["ACCOUNTS_RECE"])
    inventory = as_float(latest_bs["INVENTORY"])
    goodwill = as_float(latest_bs["GOODWILL"])

    cogs_2024 = revenue_map["2024"] * (1 - as_float(gross_margin_row["20241231"]) / 100)

    fcf_rows = []
    for _, annual_row in cf_annual.tail(3).iterrows():
        year = str(pd.to_datetime(annual_row["REPORT_DATE"]).year)
        fcf = as_float(annual_row["NETCASH_OPERATE"]) - as_float(annual_row["CONSTRUCT_LONG_ASSET"])
        fcf_rows.append({"year": year, "fcf": fcf})

    payout_rows = []
    for year in ["2022", "2023", "2024"]:
        row = fhps[fhps["报告期"].astype(str) == f"{year}-12-31"]
        if row.empty:
            continue
        item = row.iloc[-1]
        dps = as_float(item["现金分红-现金分红比例"]) / 10
        eps = as_float(item["每股收益"])
        payout_ratio = 0.0 if eps <= 0 else dps / eps * 100
        payout_rows.append({"year": year, "dps": dps, "eps": eps, "payout_ratio": payout_ratio})

    interim_2025_row = fhps[fhps["报告期"].astype(str) == "2025-06-30"]
    interim_2025_dps = 0.0
    if not interim_2025_row.empty:
        interim_2025_dps = as_float(interim_2025_row.iloc[-1]["现金分红-现金分红比例"]) / 10

    snippet_keywords = {
        "operating_summary": "2024年公司实现营业收入129,870.89万元",
        "overseas_layout": "公司已在美国、德国、印度、日本、巴西等地设立了全资子公司",
        "wind_power_strategy": "深耕风电领域，丰富产品类别，拓展应用场景",
        "moat": "公司在高空安全领域深耕近二十年",
        "r_and_d": "公司研发投入8,495.80万元",
        "dividend_plan": "每10股派发现金红利4.5元",
    }
    snippets = {key: extract_snippet(normalized_text, keyword) for key, keyword in snippet_keywords.items()}

    roe_ge_15_years = sum(1 for value in roe_values if value >= 15)
    roe_any_below_10 = any(value < 10 for value in roe_values)

    metrics = {
        "price": price,
        "price_date": price_date,
        "price_time": price_time,
        "price_source": price_source,
        "annual_basis": "2024A",
        "latest_operating_basis": "2025Q3",
        "roe_2020_2024": roe_values,
        "roe_avg": sum(roe_values) / len(roe_values),
        "roe_ge_15_years": roe_ge_15_years,
        "roe_any_below_10": roe_any_below_10,
        "hard_threshold_status": "淘汰" if roe_any_below_10 or roe_ge_15_years < 4 or sum(roe_values) / len(roe_values) < 15 else "达标",
        "revenue_2020_2024": revenue_map,
        "net_profit_2020_2024": profit_map,
        "operating_cashflow_2020_2024": ocf_map,
        "eps_2020_2024": eps_map,
        "bps_2020_2024": bps_map,
        "revenue_cagr_2020_2024": cagr(revenue_map["2020"], revenue_map["2024"], 4) * 100,
        "net_profit_cagr_2020_2024": cagr(profit_map["2020"], profit_map["2024"], 4) * 100,
        "fcf_2022_2024": fcf_rows,
        "fcf_sum_3y": sum(item["fcf"] for item in fcf_rows),
        "payout_rows": payout_rows,
        "payout_avg": 0.0 if not payout_rows else sum(item["payout_ratio"] for item in payout_rows) / len(payout_rows),
        "interim_2025_dps": interim_2025_dps,
        "dividend_yield_2024": 0.0 if not payout_rows else payout_rows[-1]["dps"] / price * 100,
        "trailing_cash_return_estimate": (0.0 if not payout_rows else payout_rows[-1]["dps"]) + interim_2025_dps,
        "debt_ratio_2024": 0.0 if total_assets <= 0 else total_liabilities / total_assets * 100,
        "gross_margin_2024": as_float(gross_margin_row["20241231"]),
        "net_margin_2024": as_float(net_margin_row["20241231"]),
        "expense_ratio_2024": as_float(expense_row["20241231"]),
        "cash_2024": cash,
        "accounts_receivable_2024": accounts_receivable,
        "inventory_2024": inventory,
        "goodwill_2024": goodwill,
        "goodwill_to_equity_2024": 0.0 if equity <= 0 else goodwill / equity * 100,
        "ar_days_2024": 0.0 if revenue_map["2024"] <= 0 else 365 * accounts_receivable / revenue_map["2024"],
        "inventory_days_2024": 0.0 if cogs_2024 <= 0 else 365 * inventory / cogs_2024,
        "pe_2024": 0.0 if eps_map["2024"] <= 0 else price / eps_map["2024"],
        "pb_2024": 0.0 if bps_map["2024"] <= 0 else price / bps_map["2024"],
        "revenue_2025q3": revenue_2025q3,
        "revenue_2025q3_yoy": as_float(revenue_growth_row.get("20250930", 0.0)),
        "profit_2025q3": profit_2025q3,
        "profit_2025q3_yoy": 0.0 if profit_2024q3 <= 0 else (profit_2025q3 / profit_2024q3 - 1) * 100,
        "ocf_2025q3": ocf_2025q3,
        "ocf_2025q3_yoy": 0.0 if ocf_2024q3 <= 0 else (ocf_2025q3 / ocf_2024q3 - 1) * 100,
        "ocf_to_profit_2024": 0.0 if profit_map["2024"] <= 0 else ocf_map["2024"] / profit_map["2024"] * 100,
        "ocf_to_profit_2025q3": 0.0 if profit_2025q3 <= 0 else ocf_2025q3 / profit_2025q3 * 100,
        "ttm_revenue": ttm_revenue,
        "ttm_profit": ttm_profit,
        "ttm_eps": ttm_eps,
        "ttm_ocf": ttm_ocf,
        "pe_ttm": 0.0 if ttm_eps <= 0 else price / ttm_eps,
        "annual_report_pdf_url": pdf_url,
        "report_snippets": snippets,
    }

    raw_payload = {
        "price_row": make_json_safe([price_row]),
        "financial_abstract_rows": make_json_safe(
            fa[
                fa["指标"].astype(str).str.contains(
                    r"归母净利润|营业总收入|经营现金流量净额|净资产收益率\(ROE\)|毛利率|销售净利率|期间费用率|每股净资产|基本每股收益|营业总收入增长率",
                    na=False,
                )
            ].to_dict(orient="records")
        ),
        "balance_annual": make_json_safe(
            bs_annual[
                [
                    "REPORT_DATE",
                    "TOTAL_ASSETS",
                    "TOTAL_LIABILITIES",
                    "MONETARYFUNDS",
                    "ACCOUNTS_RECE",
                    "INVENTORY",
                    "GOODWILL",
                ]
            ].to_dict(orient="records")
        ),
        "cashflow_annual": make_json_safe(
            cf_annual[
                ["REPORT_DATE", "NETCASH_OPERATE", "CONSTRUCT_LONG_ASSET", "INVEST_PAY_CASH"]
            ].to_dict(orient="records")
        ),
        "fhps_tail": make_json_safe(fhps.tail(8).to_dict(orient="records")),
        "annual_report_pdf_url": pdf_url,
        "report_snippets": snippets,
        "price_snapshot": {
            "price": price,
            "price_date": price_date,
            "price_time": price_time,
            "price_source": price_source,
        },
    }

    snippet_lines = []
    for key, value in snippets.items():
        snippet_lines.append(f"## {key}")
        snippet_lines.append(value or "未匹配到")
        snippet_lines.append("")

    SNIPPETS_OUT.write_text("\n".join(snippet_lines), encoding="utf-8")
    LATEST_OUT.write_text(json.dumps(raw_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    METRICS_OUT.write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()