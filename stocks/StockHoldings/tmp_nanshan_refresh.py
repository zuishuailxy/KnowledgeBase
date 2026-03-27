import json
import os
from pathlib import Path

import akshare as ak
import pandas as pd


os.environ["AKSHARE_TQDM_DISABLE"] = "1"

BASE_DIR = Path(__file__).resolve().parent
PRICE = 5.90


def find_metric(df: pd.DataFrame, keyword: str) -> pd.Series:
    mask = df["指标"].astype(str).str.contains(keyword, na=False)
    matched = df[mask]
    if matched.empty:
        raise KeyError(f"metric not found: {keyword}")
    return matched.iloc[0]


def as_float(value) -> float:
    if pd.isna(value):
        return 0.0
    return float(value)


def cagr(start_value: float, end_value: float, years: int) -> float:
    if start_value <= 0 or end_value <= 0 or years <= 0:
        return 0.0
    return (end_value / start_value) ** (1 / years) - 1


def make_json_safe(records: list[dict]) -> list[dict]:
    safe_records = []
    for record in records:
        safe_record = {}
        for key, value in record.items():
            if isinstance(value, (pd.Timestamp,)):
                safe_record[key] = value.strftime("%Y-%m-%d")
            elif hasattr(value, "isoformat") and not isinstance(value, (str, bytes, int, float, bool)):
                safe_record[key] = value.isoformat()
            else:
                safe_record[key] = None if pd.isna(value) else value
        safe_records.append(safe_record)
    return safe_records


def main() -> None:
    fa = ak.stock_financial_abstract(symbol="600219")
    bs = ak.stock_balance_sheet_by_report_em(symbol="SH600219")
    cf = ak.stock_cash_flow_sheet_by_report_em(symbol="SH600219")
    fhps = ak.stock_fhps_detail_em(symbol="600219")

    bs_annual = bs[bs["REPORT_TYPE"] == "年报"].sort_values("REPORT_DATE").tail(5).copy()
    cf_annual = cf[cf["REPORT_TYPE"] == "年报"].sort_values("REPORT_DATE").tail(5).copy()

    years = ["20211231", "20221231", "20231231", "20241231", "20251231"]
    roe_row = find_metric(fa, r"净资产收益率\(ROE\)")
    revenue_row = find_metric(fa, "营业总收入")
    profit_row = find_metric(fa, "归母净利润")
    revenue_growth_row = find_metric(fa, "营业总收入增长率")
    gross_margin_row = find_metric(fa, "毛利率")
    net_margin_row = find_metric(fa, "销售净利率")
    expense_ratio_row = find_metric(fa, "期间费用率")

    roe_values = [round(as_float(roe_row[year]), 2) for year in years]
    revenue_2025 = as_float(revenue_row["20251231"])
    revenue_2024 = as_float(revenue_row["20241231"])
    profit_2025 = as_float(profit_row["20251231"])
    profit_2024 = as_float(profit_row["20241231"])

    payout_rows = []
    for year in ["2023", "2024", "2025"]:
        report_date = f"{year}-12-31"
        row = fhps[fhps["报告期"].astype(str) == report_date]
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

    fcf_rows = []
    for _, row in cf_annual.tail(3).iterrows():
        year = str(pd.to_datetime(row["REPORT_DATE"]).year)
        fcf = as_float(row["NETCASH_OPERATE"]) - as_float(row["CONSTRUCT_LONG_ASSET"])
        fcf_rows.append({"year": year, "fcf": fcf})

    latest_bs = bs_annual.iloc[-1]
    shares_2025 = as_float(fhps[fhps["报告期"].astype(str) == "2025-12-31"].iloc[-1]["总股本"])
    equity_2025 = as_float(latest_bs["TOTAL_ASSETS"]) - as_float(latest_bs["TOTAL_LIABILITIES"])
    eps_2025 = 0.0 if shares_2025 <= 0 else profit_2025 / shares_2025
    bps_2025 = 0.0 if shares_2025 <= 0 else equity_2025 / shares_2025
    gross_margin_2025 = as_float(gross_margin_row["20251231"])
    cogs_2025 = revenue_2025 * (1 - gross_margin_2025 / 100)
    inventory_2025 = as_float(latest_bs["INVENTORY"])
    accounts_rece_2025 = as_float(latest_bs["ACCOUNTS_RECE"])

    metrics = {
        "price": PRICE,
        "annual_basis": "2025A",
        "latest_operating_basis": "2025A",
        "roe_2021_2025": roe_values,
        "roe_avg": sum(roe_values) / len(roe_values),
        "revenue_2025": revenue_2025,
        "net_profit_2025": profit_2025,
        "revenue_yoy_2025": as_float(revenue_growth_row["20251231"]),
        "net_profit_yoy_2025": (profit_2025 / profit_2024 - 1) * 100 if profit_2024 else 0.0,
        "revenue_cagr_2021_2025": cagr(as_float(revenue_row["20211231"]), revenue_2025, 4) * 100,
        "net_profit_cagr_2021_2025": cagr(as_float(profit_row["20211231"]), profit_2025, 4) * 100,
        "fcf_2023_2025": fcf_rows,
        "fcf_sum_3y": sum(item["fcf"] for item in fcf_rows),
        "payout_rows": payout_rows,
        "payout_avg": sum(item["payout_ratio"] for item in payout_rows) / len(payout_rows),
        "debt_ratio_2025": as_float(latest_bs["TOTAL_LIABILITIES"]) / as_float(latest_bs["TOTAL_ASSETS"]) * 100,
        "gross_margin_2025": gross_margin_2025,
        "net_margin_2025": as_float(net_margin_row["20251231"]),
        "expense_ratio_2025": as_float(expense_ratio_row["20251231"]),
        "ar_days_2025": 365 * accounts_rece_2025 / revenue_2025 if revenue_2025 else 0.0,
        "inventory_days_2025": 365 * inventory_2025 / cogs_2025 if cogs_2025 else 0.0,
        "monetaryfunds_2025": as_float(latest_bs["MONETARYFUNDS"]),
        "accounts_rece_2025": accounts_rece_2025,
        "inventory_2025": inventory_2025,
        "goodwill_2025": as_float(latest_bs["GOODWILL"]),
        "shares_2025": shares_2025,
        "eps_2025": eps_2025,
        "bps_2025": bps_2025,
        "pe_2025": 0.0 if eps_2025 <= 0 else PRICE / eps_2025,
        "pb_2025": 0.0 if bps_2025 <= 0 else PRICE / bps_2025,
    }

    raw_payload = {
        "price": PRICE,
        "financial_abstract_rows": fa[
            fa["指标"].astype(str).str.contains(
                r"归母净利润|营业总收入|净资产收益率\(ROE\)|毛利率|销售净利率|期间费用率",
                na=False,
            )
        ].to_dict(orient="records"),
        "balance_annual": make_json_safe(bs_annual[
            [
                "REPORT_DATE",
                "TOTAL_ASSETS",
                "TOTAL_LIABILITIES",
                "MONETARYFUNDS",
                "INVENTORY",
                "ACCOUNTS_RECE",
                "GOODWILL",
            ]
        ].to_dict(orient="records")),
        "cashflow_annual": make_json_safe(cf_annual[
            ["REPORT_DATE", "NETCASH_OPERATE", "CONSTRUCT_LONG_ASSET", "INVEST_PAY_CASH"]
        ].to_dict(orient="records")),
        "fhps_tail": make_json_safe(fhps.tail(8).to_dict(orient="records")),
    }

    (BASE_DIR / "nanshan_latest_refresh.json").write_text(
        json.dumps(raw_payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (BASE_DIR / "nanshan_metrics.json").write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()