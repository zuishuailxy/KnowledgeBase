import json
import os
import re
from pathlib import Path

import akshare as ak
import requests
from pypdf import PdfReader

os.environ['AKSHARE_TQDM_DISABLE'] = '1'

BASE = Path(r"d:\github\KnowledgeBase\stocks\StockHoldings")
OUT = BASE / "cmcc_threshold_data.json"
SNIPPETS = BASE / "cmcc_dividend_snippets.txt"

reports = {
    "2024": "http://static.cninfo.com.cn/finalpage/2025-03-21/1222856315.PDF",
    "2023": "http://static.cninfo.com.cn/finalpage/2024-03-22/1219372942.PDF",
    "2022": "http://static.cninfo.com.cn/finalpage/2023-03-24/1216200838.PDF",
}


def extract_pdf_text(url: str, target: Path) -> str:
    if not target.exists():
        response = requests.get(url, timeout=90)
        response.raise_for_status()
        target.write_bytes(response.content)
    reader = PdfReader(str(target))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


fa = ak.stock_financial_abstract(symbol="600941")
roe_rows = fa[fa["指标"].astype(str).str.contains("净资产收益率", na=False)]
debt_rows = fa[fa["指标"].astype(str).str.contains("资产负债率", na=False)]
dividend_rows = fa[fa["指标"].astype(str).str.contains("分红", na=False)]

bs = ak.stock_balance_sheet_by_report_em(symbol="SH600941")
bs = bs[bs["REPORT_TYPE"] == "年报"].sort_values("REPORT_DATE").tail(5)
bs_rows = [
    {
        "date": str(row["REPORT_DATE"])[:10],
        "total_assets": float(row["TOTAL_ASSETS"] or 0),
        "total_liabilities": float(row["TOTAL_LIABILITIES"] or 0),
    }
    for _, row in bs.iterrows()
]

cf = ak.stock_cash_flow_sheet_by_report_em(symbol="SH600941")
cf = cf[cf["REPORT_TYPE"] == "年报"].sort_values("REPORT_DATE").tail(5)
cf_rows = [
    {
        "date": str(row["REPORT_DATE"])[:10],
        "netcash_operate": float(row["NETCASH_OPERATE"] or 0),
        "construct_long_asset": float(row["CONSTRUCT_LONG_ASSET"] or 0),
    }
    for _, row in cf.iterrows()
]

snippet_lines = []
pdf_matches = {}
for year, url in reports.items():
    pdf_path = BASE / f"cmcc_{year}.pdf"
    text = extract_pdf_text(url, pdf_path)
    normalized = text.replace(" ", "")
    matches = []
    for pattern in [
        r"派息率[^\d]{0,8}(\d+\.?\d*)%",
        r"现金分红[^\d]{0,15}(\d+\.?\d*)%",
        r"分红比例[^\d]{0,15}(\d+\.?\d*)%",
        r"股息支付率[^\d]{0,15}(\d+\.?\d*)%",
    ]:
        for m in re.finditer(pattern, normalized):
            start = max(0, m.start() - 80)
            end = min(len(normalized), m.end() + 120)
            snippet = normalized[start:end]
            matches.append({"pattern": pattern, "value": m.group(1), "snippet": snippet})
    pdf_matches[year] = matches[:20]
    snippet_lines.append(f"## {year}")
    for item in matches[:10]:
        snippet_lines.append(item["snippet"])
        snippet_lines.append("")

SNIPPETS.write_text("\n".join(snippet_lines), encoding="utf-8")
OUT.write_text(
    json.dumps(
        {
            "roe": roe_rows.to_dict(orient="records"),
            "debt": debt_rows.to_dict(orient="records"),
            "dividend_metrics": dividend_rows.to_dict(orient="records"),
            "balance_sheet": bs_rows,
            "cash_flow": cf_rows,
            "pdf_matches": pdf_matches,
        },
        ensure_ascii=False,
        default=str,
        indent=2,
    ),
    encoding="utf-8",
)
print(str(OUT))
