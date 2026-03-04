"""
outline.py — Agent 3: Outline Agent

Single responsibility: Synthesise scraped research content and the topic
blueprint into a structured, hierarchical blog outline.

I/O:
  Reads:  state["scraped_content"], state["topic_blueprint"]
  Writes: state["blog_outline"]

Tools: LLM only (with_structured_output → BlogOutline)
"""
import logging
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from blog_pipeline.config import LLM_MODEL, LLM_TEMPERATURE
from blog_pipeline.state import (
    PipelineState,
    BlogOutline,
    ScrapedDocument,
    PipelineError,
)

# Max words extracted from each scraped doc to avoid LLM context overflow
MAX_WORDS_PER_DOC = 1500

# ── System prompt ──────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a world-class content strategist and SEO expert.

Your task is to produce a detailed, hierarchical blog outline from the provided
research material. The outline must be ready for a writer to use directly.

Rules:
- title: Craft a compelling, keyword-rich H1 (do NOT include # in the string).
- meta_description: Strictly ≤ 160 characters, includes the primary keyword.
- sections: 5–10 sections mixing H2 (major) and H3 (sub-sections under H2s).
  • Every H3 must set its parent field to the exact text of its parent H2.
  • key_points: 3–5 specific, fact-based bullets (not vague instructions).
  • target_word_count: realistic per section (H2: 250–500, H3: 100–250).
  • source_urls: list the 1–3 scraped URLs most relevant to this section.
- estimated_total_words: must equal the sum of all target_word_counts + ~200
  for intro + ~150 for conclusion.
- Do NOT fabricate facts. Only reference what is in the research material.
- Avoid generic filler headings like "Introduction" or "Conclusion" in sections."""

HUMAN_TEMPLATE = """\
Topic / Content Angle: {topic}
Search Intent: {intent}
Semantic Clusters to Cover: {clusters}
Target Audience: {audience}

--- RESEARCH MATERIAL ---
{research}
--- END RESEARCH ---

Produce the full blog outline now."""

PROMPT = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", HUMAN_TEMPLATE),
])


def _build_research_brief(
    scraped: list[ScrapedDocument],
    max_words: int = MAX_WORDS_PER_DOC,
) -> str:
    """
    Concatenate scraped docs into a single research brief, each truncated
    to `max_words` words to respect the LLM context window.
    Only includes successfully scraped docs (non-empty content).
    """
    parts = []
    for doc in scraped:
        if not doc.content or doc.word_count < 100:
            continue
        words = doc.content.split()
        excerpt = " ".join(words[:max_words])
        parts.append(f"SOURCE: {doc.url}\n{excerpt}\n")
    return "\n---\n".join(parts) if parts else "No research material available."


def outline_node(state: PipelineState) -> dict:
    """
    LangGraph node: Outline Agent (Stage 3).
    Stateless - reads scraped_content + topic_blueprint, writes blog_outline.
    """
    logger = logging.getLogger(__name__)
    logger.info("--- Invoking Outline Agent ---")
    blueprint = state.get("topic_blueprint")
    scraped: list[ScrapedDocument] = state.get("scraped_content", [])

    if not blueprint:
        error = PipelineError(
            agent="outline_agent",
            error="topic_blueprint is missing — cannot produce outline.",
            context={},
        )
        return {"errors": [error]}

    research_brief = _build_research_brief(scraped)

    llm = ChatOpenAI(model=LLM_MODEL, temperature=LLM_TEMPERATURE)
    structured_llm = llm.with_structured_output(BlogOutline)
    chain = PROMPT | structured_llm

    try:
        outline: BlogOutline = chain.invoke({
            "topic": blueprint.content_angle,
            "intent": blueprint.search_intent,
            "clusters": ", ".join(blueprint.semantic_clusters),
            "audience": state.get("target_audience") or "general readers",
            "research": research_brief,
        })
    except Exception as exc:
        error = PipelineError(
            agent="outline_agent",
            error=str(exc),
            context={"scraped_doc_count": len(scraped)},
        )
        return {"errors": [error]}

    return {"blog_outline": outline}
