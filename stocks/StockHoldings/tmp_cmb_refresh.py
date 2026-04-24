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
PDF_PATH = BASE_DIR / "cmb_2025.pdf"
LATEST_OUT = BASE_DIR / "cmb_latest_refresh.json"
METRICS_OUT = BASE_DIR / "cmb_2025_metrics.json"
SNIPPETS_OUT = BASE_DIR / "cmb_2025_snippets.txt"


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
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def extract_matches(text: str, label: str, pattern: str) -> list[dict]:
    matches = []
    for match in re.finditer(pattern, text):
        start = max(0, match.start() - 80)
        end = min(len(text), match.end() + 120)
        matches.append(
            {
                "label": label,
                "value": match.group(1),
                "snippet": text[start:end],
            }
        )
    return matches


def extract_value_context(text: str, label: str, value: str) -> dict | None:
    index = text.find(value)
    if index < 0:
        return None
    start = max(0, index - 80)
    end = min(len(text), index + len(value) + 120)
    return {
        "label": label,
        "value": value,
        "snippet": text[start:end],
    }


def main() -> None:
    existing_metrics = load_existing_json(METRICS_OUT)
    existing_latest = load_existing_json(LATEST_OUT)

    fa = ak.stock_financial_abstract(symbol="600036")
    bs = ak.stock_balance_sheet_by_report_em(symbol="SH600036")
    fhps = ak.stock_fhps_detail_em(symbol="600036")

    try:
        price_df = ak.stock_zh_a_hist(symbol="600036", period="daily", adjust="qfq")
        latest_price_row = price_df.tail(1).iloc[0]
        price = as_float(latest_price_row["收盘"])
        price_date = str(latest_price_row["日期"])[:10]
    except Exception:
        price = as_float(existing_metrics.get("price", 39.21))
        price_date = str(existing_metrics.get("price_date", "2026-04-10"))
        latest_price_row = pd.Series(existing_latest.get("price_row", [{}])[0])

    try:
        disclosures = ak.stock_zh_a_disclosure_report_cninfo(
            symbol="600036",
            category="年报",
            start_date="20260101",
            end_date="20260415",
        )
        annual_row = disclosures[disclosures["公告标题"].astype(str).str.contains("2025年度报告", na=False)]
        annual_row = annual_row[~annual_row["公告标题"].astype(str).str.contains("摘要", na=False)].iloc[0]
        pdf_url = disclosure_pdf_url(str(annual_row["公告链接"]))
    except Exception:
        pdf_url = str(existing_metrics.get("annual_report_pdf_url", "http://static.cninfo.com.cn/finalpage/2026-03-28/1225047590.PDF"))

    report_text = extract_pdf_text(pdf_url, PDF_PATH)
    normalized_text = re.sub(r"\s+", "", report_text)

    bs_annual = bs[bs["REPORT_TYPE"] == "年报"].sort_values("REPORT_DATE").tail(5).copy()

    roe_row = find_metric(fa, r"净资产收益率\(ROE\)")
    revenue_row = find_metric(fa, "营业总收入")
    profit_row = find_metric(fa, "归母净利润")
    bps_row = find_metric(fa, "每股净资产")
    eps_row = find_metric(fa, "基本每股收益")
    ocf_row = find_metric(fa, "经营现金流")

    years = ["20211231", "20221231", "20231231", "20241231", "20251231"]
    roe_values = [round(as_float(roe_row[year]), 2) for year in years]
    revenue_map = {year[:4]: as_float(revenue_row[year]) for year in years}
    profit_map = {year[:4]: as_float(profit_row[year]) for year in years}
    bps_map = {year[:4]: as_float(bps_row[year]) for year in years}
    eps_map = {year[:4]: as_float(eps_row[year]) for year in years}
    ocf_map = {year[:4]: as_float(ocf_row[year]) for year in years}

    bs_latest = bs_annual.iloc[-1]
    total_assets = as_float(bs_latest["TOTAL_ASSETS"])
    total_liabilities = as_float(bs_latest["TOTAL_LIABILITIES"])
    equity = total_assets - total_liabilities
    loans_2025 = as_float(bs_latest["LOAN_ADVANCE"])
    deposits_2025 = as_float(bs_latest["ACCEPT_DEPOSIT"])
    interbank_deposits_2025 = as_float(bs_latest["DEPOSIT_INTERBANK"])
    pbc_deposit_2025 = as_float(bs_latest["CASH_DEPOSIT_PBC"])
    goodwill_2025 = as_float(bs_latest["GOODWILL"])

    bs_2021 = bs_annual.iloc[0]
    loans_2021 = as_float(bs_2021["LOAN_ADVANCE"])
    deposits_2021 = as_float(bs_2021["ACCEPT_DEPOSIT"])
    assets_2021 = as_float(bs_2021["TOTAL_ASSETS"])

    shares = as_float(fhps[fhps["报告期"].astype(str) == "2025-12-31"].iloc[-1]["总股本"])

    payout_rows = []
    for year in ["2022", "2023", "2024"]:
        row = fhps[fhps["报告期"].astype(str) == f"{year}-12-31"]
        if row.empty:
            continue
        item = row.iloc[-1]
        dps = as_float(item["现金分红-现金分红比例"]) / 10
        eps = as_float(item["每股收益"])
        payout_ratio = 0.0 if eps <= 0 else dps / eps * 100
        payout_rows.append(
            {
                "year": year,
                "dps": dps,
                "eps": eps,
                "payout_ratio": payout_ratio,
            }
        )

    payout_2025_row = fhps[fhps["报告期"].astype(str) == "2025-12-31"]
    payout_2025 = None
    if not payout_2025_row.empty:
        item = payout_2025_row.iloc[-1]
        dps = as_float(item["现金分红-现金分红比例"]) / 10
        eps = as_float(item["每股收益"])
        payout_2025 = {
            "year": "2025",
            "dps": dps,
            "eps": eps,
            "payout_ratio": 0.0 if eps <= 0 else dps / eps * 100,
        }

    pdf_patterns = {
        "不良贷款率": r"不良贷款率[^0-9]{0,12}([0-9.]+)%",
        "拨备覆盖率": r"拨备覆盖率[^0-9]{0,12}([0-9.]+)%",
        "核心一级资本充足率": r"核心一级资本充足率[^0-9]{0,12}([0-9.]+)%",
        "一级资本充足率": r"一级资本充足率[^0-9]{0,12}([0-9.]+)%",
        "资本充足率": r"资本充足率[^0-9]{0,12}([0-9.]+)%",
        "净息差": r"净息差[^0-9]{0,12}([0-9.]+)%",
        "成本收入比": r"成本收入比[^0-9]{0,12}([0-9.]+)%",
        "管理零售客户总资产": r"管理零售客户总资产[^0-9]{0,24}([0-9,]+(?:\.[0-9]+)?亿元)",
    }
    anchor_values = {
        "不良贷款率锚点": "0.94%",
        "拨备覆盖率锚点": "391.79%",
        "资本充足水平锚点": "14.16%",
        "总资本充足率锚点": "18.24%",
        "ROAA锚点": "1.19%",
        "ROAE锚点": "13.44%",
        "2025全年分红方案锚点": "2.016",
        "2025中期分红锚点": "1.003",
    }

    pdf_matches = {}
    snippet_lines = []
    for label, pattern in pdf_patterns.items():
        matches = extract_matches(normalized_text, label, pattern)
        pdf_matches[label] = matches[:5]
        snippet_lines.append(f"## {label}")
        if matches:
            for item in matches[:3]:
                snippet_lines.append(item["snippet"])
                snippet_lines.append("")
        else:
            snippet_lines.append("未匹配到")
            snippet_lines.append("")

    anchor_matches = {}
    for label, value in anchor_values.items():
        matched = extract_value_context(normalized_text, label, value)
        if matched:
            anchor_matches[label] = matched

    dividend_2025_total_dps = 2.016 if "2025全年分红方案锚点" in anchor_matches else 0.0
    dividend_2025_interim_dps = 1.003 if "2025中期分红锚点" in anchor_matches else 0.0

    metrics = {
        "price": price,
        "price_date": price_date,
        "annual_basis": "2025A",
        "roe_2021_2025": roe_values,
        "roe_avg": sum(roe_values) / len(roe_values),
        "revenue_2021_2025": revenue_map,
        "net_profit_2021_2025": profit_map,
        "eps_2021_2025": eps_map,
        "bps_2021_2025": bps_map,
        "operating_cashflow_2021_2025": ocf_map,
        "revenue_cagr_2021_2025": cagr(revenue_map["2021"], revenue_map["2025"], 4) * 100,
        "net_profit_cagr_2021_2025": cagr(profit_map["2021"], profit_map["2025"], 4) * 100,
        "loan_cagr_2021_2025": cagr(loans_2021, loans_2025, 4) * 100,
        "deposit_cagr_2021_2025": cagr(deposits_2021, deposits_2025, 4) * 100,
        "asset_cagr_2021_2025": cagr(assets_2021, total_assets, 4) * 100,
        "total_assets_2025": total_assets,
        "total_liabilities_2025": total_liabilities,
        "equity_2025": equity,
        "asset_liability_ratio_2025": 0.0 if total_assets <= 0 else total_liabilities / total_assets * 100,
        "loan_advance_2025": loans_2025,
        "accept_deposit_2025": deposits_2025,
        "deposit_loan_ratio_2025": 0.0 if loans_2025 <= 0 else deposits_2025 / loans_2025,
        "deposit_interbank_2025": interbank_deposits_2025,
        "cash_deposit_pbc_2025": pbc_deposit_2025,
        "goodwill_2025": goodwill_2025,
        "goodwill_to_equity_2025": 0.0 if equity <= 0 else goodwill_2025 / equity * 100,
        "shares_2025": shares,
        "eps_2025": eps_map["2025"],
        "bps_2025": bps_map["2025"],
        "pe_2025": 0.0 if eps_map["2025"] <= 0 else price / eps_map["2025"],
        "pb_2025": 0.0 if bps_map["2025"] <= 0 else price / bps_map["2025"],
        "dividend_rows_completed_years": payout_rows,
        "payout_avg_completed_years": 0.0 if not payout_rows else sum(item["payout_ratio"] for item in payout_rows) / len(payout_rows),
        "dividend_yield_trailing_full_year": 0.0 if not payout_rows else payout_rows[-1]["dps"] / price * 100,
        "dividend_2025_proposal_total_dps": dividend_2025_total_dps,
        "dividend_2025_proposal_interim_dps": dividend_2025_interim_dps,
        "dividend_2025_proposal_payout_ratio": 0.0 if eps_map["2025"] <= 0 or dividend_2025_total_dps <= 0 else dividend_2025_total_dps / eps_map["2025"] * 100,
        "dividend_yield_forward_2025_proposal": 0.0 if dividend_2025_total_dps <= 0 else dividend_2025_total_dps / price * 100,
        "payout_2025_reported": payout_2025,
        "pdf_metrics": {
            label: matches[0]["value"] if matches else None
            for label, matches in pdf_matches.items()
        },
        "annual_report_anchor_metrics": {
            label: item["value"]
            for label, item in anchor_matches.items()
        },
        "annual_report_pdf_url": pdf_url,
    }

    raw_payload = {
        "price_row": make_json_safe([latest_price_row.to_dict()]),
        "financial_abstract_rows": make_json_safe(
            fa[
                fa["指标"].astype(str).str.contains(
                    r"归母净利润|营业总收入|净资产收益率\(ROE\)|每股净资产|基本每股收益|经营现金流|资产负债率",
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
                    "LOAN_ADVANCE",
                    "ACCEPT_DEPOSIT",
                    "DEPOSIT_INTERBANK",
                    "CASH_DEPOSIT_PBC",
                    "GOODWILL",
                ]
            ].to_dict(orient="records")
        ),
        "fhps_tail": make_json_safe(fhps.tail(8).to_dict(orient="records")),
        "annual_report_pdf_url": pdf_url,
        "pdf_matches": pdf_matches,
        "annual_report_anchor_matches": anchor_matches,
    }

    SNIPPETS_OUT.write_text("\n".join(snippet_lines), encoding="utf-8")
    LATEST_OUT.write_text(json.dumps(raw_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    METRICS_OUT.write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()