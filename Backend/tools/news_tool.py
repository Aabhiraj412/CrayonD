from langchain.tools import tool
import requests
import os

@tool("get_company_news")
def get_company_news(company: str) -> str:
    """Fetches recent news articles about a given company using the Serper API."""
    api_key = os.getenv("SERPER_API_KEY")
    headers = {
        "X-API-KEY": api_key,
        "Content-Type": "application/json"
    }

    payload = {
        "q": f"{company} latest news"
    }

    response = requests.post(
        "https://google.serper.dev/news",
        headers=headers,
        json=payload
    )

    if response.status_code == 200:
        articles = response.json().get("news", [])
        if not articles:
            return f"No recent news found for {company}."
        return "\n".join([f"{article['title']} - {article['link']}" for article in articles[:5]])
    else:
        return f"Failed to fetch news: {response.status_code} - {response.text}"
