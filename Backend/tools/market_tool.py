from langchain.tools import tool
import json
import re

@tool
def compare_competitors(data: str) -> str:
    """
    Compares competitor data based on a natural language or JSON string input.
    If JSON: expects keys 'competitor_1', 'competitor_2', 'metric'.
    If natural language: parses company names and metric from text.
    """
    try:
        # Try parsing as JSON first
        parsed = json.loads(data)
        c1 = parsed["competitor_1"]
        c2 = parsed["competitor_2"]
        metric = parsed["metric"]
    except:
        # Fallback: simple NLP-style parsing from natural string
        text = data.lower()
        companies = re.findall(r"\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b", data)
        metric = "sales" if "sale" in text else "market share" if "market" in text else "performance"
        if len(companies) >= 2:
            c1, c2 = companies[0], companies[1]
        else:
            return "Please provide at least two competitor names for comparison."
    
    # Simulated response (plug in real API or database here)
    return f"Comparing **{c1}** and **{c2}** based on **{metric}**. (This is a simulated comparison. Real data can be integrated via API)"
