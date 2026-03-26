import json
import os

os.environ['AKSHARE_TQDM_DISABLE'] = '1'

import akshare as ak
import pandas as pd


def to_number(value):
    if value in (None, '', '--'):
        return None
    try:
        return float(value)
    except Exception:
        return float(str(value).replace(',', ''))


def main():
    fa = ak.stock_financial_abstract(symbol='601607')
    cf = ak.stock_cash_flow_sheet_by_report_em(symbol='SH601607')
    bs = ak.stock_balance_sheet_by_report_em(symbol='SH601607')

    cf = cf[cf['REPORT_TYPE'] == '年报'].copy()
    cf['REPORT_DATE'] = pd.to_datetime(cf['REPORT_DATE'])
    cf = cf.sort_values('REPORT_DATE')

    bs = bs[bs['REPORT_TYPE'] == '年报'].copy()
    bs['REPORT_DATE'] = pd.to_datetime(bs['REPORT_DATE'])
    bs = bs.sort_values('REPORT_DATE')

    fa_map = {row['指标']: row for _, row in fa.iterrows()}

    def metric(name, year):
        row = fa_map.get(name)
        key = f'{year}1231'
        if row is None or key not in row.index:
            return None
        return to_number(row[key])

    rows = []
    for year in [2020, 2021, 2022, 2023, 2024]:
        cf_row = cf[cf['REPORT_DATE'].dt.year == year].iloc[0]
        bs_row = bs[bs['REPORT_DATE'].dt.year == year].iloc[0]
        ocf = to_number(cf_row.get('NETCASH_OPERATE')) or 0.0
        capex = to_number(cf_row.get('CONSTRUCT_LONG_ASSET')) or 0.0
        net_profit = metric('归母净利润', year)
        revenue = metric('营业总收入', year)
        rows.append(
            {
                'year': year,
                'revenue': revenue,
                'net_profit': net_profit,
                'adj_net_profit': metric('扣非净利润', year),
                'ocf': ocf,
                'capex': capex,
                'fcf': ocf - capex,
                'ocf_np': None if not net_profit else ocf / net_profit,
                'capex_rev': None if not revenue else capex / revenue,
                'inventory_reduce': to_number(cf_row.get('INVENTORY_REDUCE')),
                'operate_rece_reduce': to_number(cf_row.get('OPERATE_RECE_REDUCE')),
                'operate_payable_add': to_number(cf_row.get('OPERATE_PAYABLE_ADD')),
                'monetaryfunds': to_number(bs_row.get('MONETARYFUNDS')),
                'total_assets': to_number(bs_row.get('TOTAL_ASSETS')),
                'total_liab': to_number(bs_row.get('TOTAL_LIABILITIES')),
            }
        )

    last3 = [row for row in rows if row['year'] in (2022, 2023, 2024)]
    summary = {
        'rows': rows,
        'last3_fcf_sum': sum(row['fcf'] for row in last3),
        'last3_fcf_avg': sum(row['fcf'] for row in last3) / 3,
        'last3_fcf_median': sorted(row['fcf'] for row in last3)[1],
        'last3_ocf_sum': sum(row['ocf'] for row in last3),
        'last3_np_sum': sum(row['net_profit'] or 0 for row in last3),
        'last3_ocf_np': sum(row['ocf'] for row in last3) / sum(row['net_profit'] or 0 for row in last3),
        'positive_fcf_years_last3': sum(1 for row in last3 if row['fcf'] > 0),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()