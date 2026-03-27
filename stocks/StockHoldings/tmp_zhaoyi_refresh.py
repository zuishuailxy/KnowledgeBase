import json
import os
from pathlib import Path

import akshare as ak


os.environ["AKSHARE_TQDM_DISABLE"] = "1"

BASE = Path(r"d:/github/KnowledgeBase/stocks/StockHoldings")
RAW_OUT = BASE / "zhaoyi_latest_refresh.json"
METRICS_OUT = BASE / "zhaoyi_metrics.json"
FALLBACK_PRICE = 255.92


def get_row(dataframe, name: str):
    return dataframe[dataframe["指标"].astype(str) == name].iloc[0]


def resolve_shares(share_map: dict[str, float], year: str) -> float:
    if year in share_map:
        return share_map[year]

    available_years = sorted(share_map)
    for candidate in available_years:
        if candidate > year:
            return share_map[candidate]

    return share_map[available_years[-1]]


def main() -> None:
    financial_abstract = ak.stock_financial_abstract(symbol="603986")
    balance_annual = ak.stock_balance_sheet_by_report_em(symbol="SH603986")
    balance_annual = balance_annual[balance_annual["REPORT_TYPE"] == "年报"]
    balance_annual = balance_annual.sort_values("REPORT_DATE").tail(5)

    cashflow_annual = ak.stock_cash_flow_sheet_by_report_em(symbol="SH603986")
    cashflow_annual = cashflow_annual[cashflow_annual["REPORT_TYPE"] == "年报"]
    cashflow_annual = cashflow_annual.sort_values("REPORT_DATE").tail(5)

    dividend_rows = ak.stock_fhps_detail_em(symbol="603986").tail(10)
    business_rows = ak.stock_zygc_em(symbol="SH603986")
    business_rows = business_rows[business_rows["报告日期"].astype(str).str.startswith("2024")]

    payload = {
        "price": FALLBACK_PRICE,
        "financial_abstract": financial_abstract.to_dict(orient="records"),
        "balance_annual": balance_annual.to_dict(orient="records"),
        "cashflow_annual": cashflow_annual.to_dict(orient="records"),
        "fhps_tail": dividend_rows.to_dict(orient="records"),
        "business_rows_2024": business_rows.to_dict(orient="records"),
    }

    roe_row = get_row(financial_abstract, "净资产收益率(ROE)")
    revenue_row = get_row(financial_abstract, "营业总收入")
    net_profit_row = get_row(financial_abstract, "归母净利润")
    gross_margin_row = get_row(financial_abstract, "毛利率")
    net_margin_row = get_row(financial_abstract, "销售净利率")
    expense_row = get_row(financial_abstract, "期间费用率")
    ar_days_row = get_row(financial_abstract, "应收账款周转天数")
    inventory_days_row = get_row(financial_abstract, "存货周转天数")

    share_map = {}
    payout_map = {}
    for _, row in dividend_rows.iterrows():
        year = str(row["报告期"])[:4]
        share_map[year] = float(row["总股本"] or 0)
        payout_map.setdefault(year, 0.0)
        payout_map[year] += float(row["现金分红-现金分红比例"] or 0) / 10.0

    roe_years = [float(roe_row[f"{year}1231"]) for year in range(2020, 2025)]
    revenue_map = {str(year): float(revenue_row[f"{year}1231"]) for year in range(2020, 2025)}
    net_profit_map = {str(year): float(net_profit_row[f"{year}1231"]) for year in range(2020, 2025)}

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
    for year in ["2022", "2023", "2024"]:
        shares = resolve_shares(share_map, year)
        eps = net_profit_map[year] / shares
        dps = payout_map.get(year, 0.0)
        payout_rows.append(
            {
                "year": year,
                "dps": dps,
                "eps": eps,
                "payout_ratio": dps / eps * 100,
            }
        )

    balance_2024 = balance_annual.iloc[-1]
    shares_2024 = share_map["2024"]
    total_assets = float(balance_2024["TOTAL_ASSETS"] or 0)
    total_liabilities = float(balance_2024["TOTAL_LIABILITIES"] or 0)
    equity = total_assets - total_liabilities
    eps_2024 = net_profit_map["2024"] / shares_2024
    bps_2024 = equity / shares_2024

    metrics = {
        "price": FALLBACK_PRICE,
        "annual_basis": "2024A",
        "latest_operating_basis": "2025Q3",
        "roe_2020_2024": roe_years,
        "roe_avg": sum(roe_years) / len(roe_years),
        "revenue_2024": revenue_map["2024"],
        "net_profit_2024": net_profit_map["2024"],
        "revenue_yoy_2024": (revenue_map["2024"] / revenue_map["2023"] - 1) * 100,
        "net_profit_yoy_2024": (net_profit_map["2024"] / net_profit_map["2023"] - 1) * 100,
        "revenue_cagr_2020_2024": (revenue_map["2024"] / revenue_map["2020"]) ** 0.25 * 100 - 100,
        "net_profit_cagr_2020_2024": (net_profit_map["2024"] / net_profit_map["2020"]) ** 0.25 * 100 - 100,
        "fcf_2022_2024": fcf_rows,
        "fcf_sum_3y": sum(item["fcf"] for item in fcf_rows),
        "payout_rows": payout_rows,
        "payout_avg": sum(item["payout_ratio"] for item in payout_rows) / len(payout_rows),
        "debt_ratio_2024": total_liabilities / total_assets * 100,
        "gross_margin_2024": float(gross_margin_row["20241231"] or 0),
        "net_margin_2024": float(net_margin_row["20241231"] or 0),
        "expense_ratio_2024": float(expense_row["20241231"] or 0),
        "ar_days_2024": float(ar_days_row["20241231"] or 0),
        "inventory_days_2024": float(inventory_days_row["20241231"] or 0),
        "monetaryfunds_2024": float(balance_2024["MONETARYFUNDS"] or 0),
        "accounts_rece_2024": float(balance_2024["ACCOUNTS_RECE"] or 0),
        "inventory_2024": float(balance_2024["INVENTORY"] or 0),
        "goodwill_2024": float(balance_2024["GOODWILL"] or 0),
        "develop_expense_2024": float(balance_2024["DEVELOP_EXPENSE"] or 0),
        "shares_2024": shares_2024,
        "eps_2024": eps_2024,
        "bps_2024": bps_2024,
        "pe_2024": FALLBACK_PRICE / eps_2024,
        "pb_2024": FALLBACK_PRICE / bps_2024,
        "revenue_2025q3": float(revenue_row["20250930"] or 0),
        "revenue_2025q3_yoy": (float(revenue_row["20250930"] or 0) / float(revenue_row["20240930"] or 1) - 1) * 100,
        "net_profit_2025q3": float(net_profit_row["20250930"] or 0),
        "net_profit_2025q3_yoy": (float(net_profit_row["20250930"] or 0) / float(net_profit_row["20240930"] or 1) - 1) * 100,
        "gross_margin_2025q3": float(gross_margin_row["20250930"] or 0),
        "net_margin_2025q3": float(net_margin_row["20250930"] or 0),
        "expense_ratio_2025q3": float(expense_row["20250930"] or 0),
        "roe_2025q3": float(roe_row["20250930"] or 0),
    }

    RAW_OUT.write_text(
        json.dumps(payload, ensure_ascii=False, default=str, indent=2),
        encoding="utf-8",
    )
    METRICS_OUT.write_text(
        json.dumps(metrics, ensure_ascii=False, default=str, indent=2),
        encoding="utf-8",
    )

    print(RAW_OUT)
    print(METRICS_OUT)


if __name__ == "__main__":
    main()