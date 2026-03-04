"""
search_agent.py — Agent 2.1: Search Agent

Single responsibility: Execute one search query and collect raw URLs.

Receives a single query via LangGraph's Send API (parallel fan-out).
Writes to: state["raw_urls"] (list reducer — safe for parallel writes)

Tools: Tavily Search API (via blog_pipeline.tools.search_tool)
"""
import logging
from blog_pipeline.state import SearchSubState, PipelineError
from blog_pipeline.tools.search_tool import run_search

logger = logging.getLogger(__name__)


def search_agent_node(state: SearchSubState) -> dict:
    """
    Returns a partial PipelineState update (raw_urls, errors).
    """
    query: str = state["query"]
    logger.info(f"--- Invoking Search Agent for query: '{query}' ---")

    try:
        results = run_search(query)
        urls = [r["url"] for r in results if r.get("url")]
        return {"raw_urls": urls}
    except Exception as exc:
        error = PipelineError(
            agent="search_agent",
            error=str(exc),
            context={"query": query},
        )
        return {"raw_urls": [], "errors": [error]}
