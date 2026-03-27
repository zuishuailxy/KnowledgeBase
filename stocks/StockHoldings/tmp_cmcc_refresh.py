import json
import os
from pathlib import Path

import akshare as ak


os.environ["AKSHARE_TQDM_DISABLE"] = "1"

BASE = Path(r"d:/github/KnowledgeBase/stocks/StockHoldings")
OUT = BASE / "cmcc_latest_refresh.json"
METRICS_OUT = BASE / "cmcc_2025_metrics.json"
FALLBACK_PRICE = 93.19


def get_row(dataframe, name: str):
    return dataframe[dataframe["指标"].astype(str) == name].iloc[0]


def main() -> None:
    financial_abstract = ak.stock_financial_abstract(symbol="600941")

    balance_annual = ak.stock_balance_sheet_by_report_em(symbol="SH600941")
    balance_annual = balance_annual[balance_annual["REPORT_TYPE"] == "年报"]
    balance_annual = balance_annual.sort_values("REPORT_DATE").tail(5)

    cashflow_annual = ak.stock_cash_flow_sheet_by_report_em(symbol="SH600941")
    cashflow_annual = cashflow_annual[cashflow_annual["REPORT_TYPE"] == "年报"]
    cashflow_annual = cashflow_annual.sort_values("REPORT_DATE").tail(5)

    dividend_rows = ak.stock_fhps_detail_em(symbol="600941").tail(10)

    try:
        latest_price = ak.stock_zh_a_hist(symbol="600941", period="daily", adjust="qfq").tail(1)
        price = float(latest_price.iloc[0]["收盘"])
    except Exception:
        price = FALLBACK_PRICE

    payload = {
        "price": price,
        "financial_abstract": financial_abstract.to_dict(orient="records"),
        "balance_annual": balance_annual.to_dict(orient="records"),
        "cashflow_annual": cashflow_annual.to_dict(orient="records"),
        "fhps_tail": dividend_rows.to_dict(orient="records"),
    }

    roe_row = get_row(financial_abstract, "净资产收益率(ROE)")
    revenue_row = get_row(financial_abstract, "营业总收入")
    net_profit_row = get_row(financial_abstract, "归母净利润")
    gross_margin_row = get_row(financial_abstract, "毛利率")
    net_margin_row = get_row(financial_abstract, "销售净利率")
    expense_row = get_row(financial_abstract, "期间费用率")

    share_map = {}
    payout_map = {}
    for _, row in dividend_rows.iterrows():
        year = str(row["报告期"])[:4]
        share_map[year] = float(row["总股本"] or 0)
        payout_map.setdefault(year, 0.0)
        payout_map[year] += float(row["现金分红-现金分红比例"] or 0) / 10.0

    roe_years = [float(roe_row[f"{year}1231"]) for year in range(2021, 2026)]
    revenue_map = {str(year): float(revenue_row[f"{year}1231"]) for year in range(2021, 2026)}
    net_profit_map = {str(year): float(net_profit_row[f"{year}1231"]) for year in range(2021, 2026)}

    fcf_rows = []
    for _, row in cashflow_annual.tail(3).iterrows():
        year = str(row["REPORT_DATE"])[:4]
        fcf_rows.append(
            {
                "year": year,
                "fcf": float(row["NETCASH_OPERATE"] or 0) - float(row["CONSTRUCT_LONG_ASSET"] or 0),
            }
        )

    payout_rows = []
    for year in ["2023", "2024", "2025"]:
        shares = share_map[year]
        eps = net_profit_map[year] / shares
        dps = payout_map[year]
        payout_rows.append(
            {
                "year": year,
                "dps": dps,
                "eps": eps,
                "payout_ratio": dps / eps * 100,
            }
        )

    balance_2025 = balance_annual.iloc[-1]
    shares_2025 = share_map["2025"]
    total_assets = float(balance_2025["TOTAL_ASSETS"] or 0)
    total_liabilities = float(balance_2025["TOTAL_LIABILITIES"] or 0)
    equity = total_assets - total_liabilities
    revenue_2025 = revenue_map["2025"]
    gross_margin_2025 = float(gross_margin_row["20251231"] or 0)
    cogs_2025 = revenue_2025 * (1 - gross_margin_2025 / 100)
    eps_2025 = net_profit_map["2025"] / shares_2025
    bps_2025 = equity / shares_2025

    metrics = {
        "price": price,
        "roe_2021_2025": roe_years,
        "roe_avg": sum(roe_years) / len(roe_years),
        "revenue_2025": revenue_2025,
        "net_profit_2025": net_profit_map["2025"],
        "revenue_yoy_2025": (revenue_map["2025"] / revenue_map["2024"] - 1) * 100,
        "net_profit_yoy_2025": (net_profit_map["2025"] / net_profit_map["2024"] - 1) * 100,
        "revenue_cagr_2021_2025": (revenue_map["2025"] / revenue_map["2021"]) ** 0.25 * 100 - 100,
        "net_profit_cagr_2021_2025": (net_profit_map["2025"] / net_profit_map["2021"]) ** 0.25 * 100 - 100,
        "fcf_2023_2025": fcf_rows,
        "fcf_sum_3y": sum(item["fcf"] for item in fcf_rows),
        "payout_rows": payout_rows,
        "payout_avg": sum(item["payout_ratio"] for item in payout_rows) / len(payout_rows),
        "debt_ratio_2025": total_liabilities / total_assets * 100,
        "gross_margin_2025": gross_margin_2025,
        "net_margin_2025": float(net_margin_row["20251231"] or 0),
        "expense_ratio_2025": float(expense_row["20251231"] or 0),
        "ar_days_2025": float(balance_2025["ACCOUNTS_RECE"] or 0) / revenue_2025 * 365,
        "inventory_days_2025": float(balance_2025["INVENTORY"] or 0) / cogs_2025 * 365,
        "shares_2025": shares_2025,
        "eps_2025": eps_2025,
        "bps_2025": bps_2025,
        "pe_2025": price / eps_2025,
        "pb_2025": price / bps_2025,
    }

    OUT.write_text(
        json.dumps(payload, ensure_ascii=False, default=str, indent=2),
        encoding="utf-8",
    )
    METRICS_OUT.write_text(
        json.dumps(metrics, ensure_ascii=False, default=str, indent=2),
        encoding="utf-8",
    )
    print(OUT)
    print(METRICS_OUT)


if __name__ == "__main__":
    main()