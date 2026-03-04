"""
search_tool.py — Tavily search wrapper.

Encapsulates the Tavily API call so agents never import Tavily directly.
The tool is intentionally simple: it accepts a query string and returns
a list of result dicts with 'url', 'title', and optional 'content'.
"""
import os
from typing import Any
from tavily import TavilyClient

from blog_pipeline.config import TAVILY_API_KEY, SEARCH_MAX_RESULTS


def run_search(query: str, max_results: int = SEARCH_MAX_RESULTS) -> list[dict[str, Any]]:
    """
    Execute a Tavily web search.

    Returns:
        List of result dicts, each containing at minimum:
          - url   (str)
          - title (str)
          - score (float) — Tavily relevance score
    """
    client = TavilyClient(api_key=TAVILY_API_KEY)
    response = client.search(
        query=query,
        max_results=max_results,
        include_raw_content=False,
        include_answer=False,
    )
    results: list[dict] = response.get("results", [])
    # Normalise keys so agents don't depend on Tavily's exact schema
    return [
        {
            "url": r.get("url", ""),
            "title": r.get("title", ""),
            "score": r.get("score", 0.0),
        }
        for r in results
        if r.get("url")
    ]
