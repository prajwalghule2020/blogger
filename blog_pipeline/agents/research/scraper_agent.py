"""
scraper_agent.py — Agent 2.3: Scraper Agent

Single responsibility: Scrape a single high-scored source URL and return
cleaned, structured content.

Receives a single ScoredSource via LangGraph's Send API (parallel fan-out).
Writes to: state["scraped_content"] (list reducer — safe for parallel writes)

Tools: Firecrawl (primary), Playwright (fallback) — via blog_pipeline.tools.scraper_tool
"""
import logging
from blog_pipeline.state import ScraperSubState, ScrapedDocument, PipelineError
from blog_pipeline.tools.scraper_tool import scrape_url

logger = logging.getLogger(__name__)


def scraper_agent_node(state: ScraperSubState) -> dict:
    """
    Returns a partial PipelineState update (scraped_content, errors).
    """
    source = state["source"]
    logger.info(f"--- Invoking Scraper Agent for URL: {source.url} ---")

    try:
        result = scrape_url(source.url)
        doc = ScrapedDocument(
            url=source.url,
            composite_score=source.composite_score,
            content=result["content"],
            word_count=result["word_count"],
            error=result.get("error"),
        )
        # Even if content is empty (error), we track it so operators can audit
        scraped = [doc]
        errors = []
        if doc.error:
            errors = [PipelineError(
                agent="scraper_agent",
                error=doc.error,
                context={"url": source.url},
            )]
        return {"scraped_content": scraped, "errors": errors}
    except Exception as exc:
        error = PipelineError(
            agent="scraper_agent",
            error=str(exc),
            context={"url": source.url},
        )
        return {"scraped_content": [], "errors": [error]}
