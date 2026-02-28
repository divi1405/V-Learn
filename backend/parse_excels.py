import json
import pandas as pd
import math

def clean_record(r):
    for k, v in r.items():
        if isinstance(v, float) and math.isnan(v):
            r[k] = None
    return r

try:
    df1 = pd.read_excel('/tmp/VeLearn_Database.xlsx')
    print("VeLearn_Database Columns:", df1.columns.tolist())
    records1 = df1.dropna(how='all').head(2).to_dict('records')
    print("VeLearn_Database Sample:")
    print(json.dumps([clean_record(r) for r in records1], indent=2))
except Exception as e:
    print("Error reading VeLearn_Database:", e)

try:
    df2 = pd.read_excel('/tmp/export_37.xlsx')
    print("\nExport_37 Columns:", df2.columns.tolist())
    records2 = df2.dropna(how='all').head(2).to_dict('records')
    print("Export_37 Sample:")
    print(json.dumps([clean_record(r) for r in records2], indent=2))
except Exception as e:
    print("Error reading Export_37:", e)
