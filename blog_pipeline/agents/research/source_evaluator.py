"""
source_evaluator.py — Agent 2.2: Source Evaluator

Single responsibility: Score and rank collected URLs by credibility, freshness,
relevance, and commercial bias. Returns the top-K sources for scraping.

I/O:
  Reads:  state["raw_urls"], state["topic_blueprint"]
  Writes: state["scored_sources"]

Tools: LLM (scoring logic) — no external API calls.

Design:
  • Deduplicates URLs before evaluation.
  • Applies a URL limit (EVALUATOR_URL_LIMIT) before passing to LLM to avoid
    context-window overflow.
  • Filters results below EVALUATOR_MIN_SCORE.
  • Returns top EVALUATOR_TOP_K sources.
"""
import logging
from typing import Literal
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from blog_pipeline.config import (
    LLM_MODEL,
    LLM_TEMPERATURE,
    EVALUATOR_TOP_K,
    EVALUATOR_MIN_SCORE,
    EVALUATOR_URL_LIMIT,
)
from blog_pipeline.state import PipelineState, ScoredSource, PipelineError


logger = logging.getLogger(__name__)


# ── Prompt ─────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a senior content researcher and SEO specialist.
Your task is to evaluate a list of URLs for use as research sources for a blog post.

For each URL, score it on:
  - credibility_score (0–1): domain authority, publisher reputation, .edu/.gov/.org boost
  - freshness_score (0–1): how recent the content likely is based on URL/domain signals
  - relevance_score (0–1): how closely the URL matches the content angle provided
  - has_commercial_bias (bool): true if the URL is a vendor page, affiliate site, or ad content
  - composite_score (0–1): weighted average: 0.4✕credibility + 0.2✕freshness + 0.35✕relevance - 0.1✕commercial_bias

Rules:
  - Be strict. Only give high scores to genuinely authoritative, relevant sources.
  - Wiki, government stats, academic papers, and reputable journalism score high.
  - Listicles, thin affiliate pages, and forums score low.
  - Return a valid JSON array of scored objects. Do NOT wrap in markdown."""

HUMAN_TEMPLATE = """\
Content Angle: {content_angle}
Topic: {topic}

URLs to evaluate (one per line):
{url_list}

Return a JSON array where each element has:
url, credibility_score, freshness_score, relevance_score, has_commercial_bias, composite_score"""

PROMPT = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", HUMAN_TEMPLATE),
])


class ScoredSourceList(BaseModel):
    """Wrapper so we can use with_structured_output for a list."""
    sources: list[ScoredSource] = Field(default_factory=list)


def source_evaluator_node(state: PipelineState) -> dict:
    """
    Stateless - reads raw_urls and topic_blueprint, returns scored_sources.
    """
    logger.info("--- Invoking Source Evaluator Agent ---")
    blueprint = state.get("topic_blueprint")
    raw_urls: list[str] = state.get("raw_urls", [])

    if not raw_urls:
        return {"scored_sources": []}

    # ── Dedup & limit ──────────────────────────────────────────────────────
    unique_urls = list(dict.fromkeys(raw_urls))[:EVALUATOR_URL_LIMIT]

    content_angle = blueprint.content_angle if blueprint else "general blog post"
    topic = state.get("topic", "")

    llm = ChatOpenAI(model=LLM_MODEL, temperature=0.0)  # deterministic scoring

    try:
        raw_response = (PROMPT | llm).invoke({
            "content_angle": content_angle,
            "topic": topic,
            "url_list": "\n".join(unique_urls),
        })
        # Parse JSON from response
        raw_json = raw_response.content.strip()
        # Strip markdown code fences if model added them
        if raw_json.startswith("```"):
            raw_json = "\n".join(raw_json.split("\n")[1:-1])
        data = json.loads(raw_json)
        sources = [ScoredSource(**item) for item in data]
    except Exception as exc:
        error = PipelineError(
            agent="source_evaluator",
            error=str(exc),
            context={"url_count": len(unique_urls)},
        )
        return {"errors": [error], "scored_sources": []}

    # ── Filter & rank ──────────────────────────────────────────────────────
    filtered = [s for s in sources if s.composite_score >= EVALUATOR_MIN_SCORE]
    top_k = sorted(filtered, key=lambda s: s.composite_score, reverse=True)[:EVALUATOR_TOP_K]

    return {"scored_sources": top_k}
