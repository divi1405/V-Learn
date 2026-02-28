import json
import pandas as pd
import math

df = pd.read_excel('/tmp/VeLearn_Database.xlsx')
print("Columns:", df.columns.tolist())
print("Sample:")

# Convert any float NaN/Infinity to None for json serialization
records = df.dropna(how='all').head(2).to_dict('records')
def clean_record(r):
    for k, v in r.items():
        if isinstance(v, float) and math.isnan(v):
            r[k] = None
    return r

clean_records = [clean_record(r) for r in records]
print(json.dumps(clean_records, indent=2))
