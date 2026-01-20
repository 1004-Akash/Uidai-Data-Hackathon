import pandas as pd
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import json
import io
import dicttoxml
from functools import lru_cache
import os

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY_REQUIRED = "579b464db66ec23bdd00000148c8a89dd06f4f7050828ca356664856"

@lru_cache()
def load_data():
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    files = os.listdir(data_dir)
    
    # Categorize files
    categories = {
        'enrol': [],
        'demo': [],
        'bio': []
    }
    
    for f in files:
        if not f.endswith('.csv'):
            continue
        if 'enrolment' in f:
            categories['enrol'].append(f)
        elif 'demographic' in f:
            categories['demo'].append(f)
        elif 'biometric' in f:
            categories['bio'].append(f)

    def load_category(cat_files):
        if not cat_files:
            return pd.DataFrame()
        dfs = []
        for f in cat_files:
            try:
                dfs.append(pd.read_csv(os.path.join(data_dir, f)))
            except Exception as e:
                print(f"Error loading {f}: {e}")
        return pd.concat(dfs, ignore_index=True) if dfs else pd.DataFrame()

    df_enrol = load_category(categories['enrol'])
    df_demo = load_category(categories['demo'])
    df_bio = load_category(categories['bio'])

    # Merge strategy:
    # 1. Start with enrolment (usually the primary data)
    # 2. Merge demographic and biometric using outer join on composite key
    key_cols = ["date", "state", "district", "pincode"]
    
    result = df_enrol
    if not df_demo.empty:
        if result.empty:
            result = df_demo
        else:
            result = pd.merge(result, df_demo, on=key_cols, how="outer")
            
    if not df_bio.empty:
        if result.empty:
            result = df_bio
        else:
            result = pd.merge(result, df_bio, on=key_cols, how="outer")

    if result.empty:
        return pd.DataFrame()

    # Fill NaNs for numeric data
    numeric_cols = [
        'age_0_5', 'age_5_17', 'age_18_greater', 
        'demo_age_5_17', 'demo_age_17_', 
        'bio_age_5_17', 'bio_age_17_'
    ]
    for col in numeric_cols:
        if col not in result.columns:
            result[col] = 0
            
    result[numeric_cols] = result[numeric_cols].fillna(0)
    
    return result

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/resource/ecd49b12-3084-4521-8f7e-ca8bf72069ba")
def get_resource(
    api_key: str = Query(..., alias="api-key"),
    format: str = Query("json", regex="^(json|csv|xml)$"),
    offset: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    state: Optional[str] = Query(None, alias="filters[state]"),
    district: Optional[str] = Query(None, alias="filters[district]")
):
    # Validate API Key
    if api_key != API_KEY_REQUIRED:
        raise HTTPException(status_code=401, detail="Invalid API Key")

    df = load_data()
    if df.empty:
        raise HTTPException(status_code=500, detail="Data could not be loaded")

    # Filter data
    filtered_df = df.copy()
    if state:
        filtered_df = filtered_df[filtered_df['state'] == state]
    if district:
        filtered_df = filtered_df[filtered_df['district'] == district]

    # Calculate Total for pagination
    total_records = len(filtered_df)
    
    # Sort by date for trend consistency
    filtered_df = filtered_df.sort_values(by="date")

    # Apply Pagination
    paginated_df = filtered_df.iloc[offset : offset + limit]

    # Format response
    data_list = paginated_df.to_dict(orient="records")

    if format == "json":
        return {
            "total": total_records,
            "offset": offset,
            "limit": limit,
            "data": data_list
        }
    
    elif format == "csv":
        output = io.StringIO()
        paginated_df.to_csv(output, index=False)
        return Response(content=output.getvalue(), media_type="text/csv")
    
    elif format == "xml":
        xml_data = dicttoxml.dicttoxml(data_list, custom_root='root', attr_type=False)
        return Response(content=xml_data, media_type="application/xml")

@app.get("/metadata/filters")
def get_filters():
    df = load_data()
    if df.empty:
        return {"states": []}
    
    # Get unique states and their districts
    states_districts = {}
    for state in df['state'].unique():
        districts = df[df['state'] == state]['district'].unique().tolist()
        states_districts[state] = districts
        
    return states_districts

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
