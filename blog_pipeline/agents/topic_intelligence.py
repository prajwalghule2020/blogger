"""
topic_intelligence.py — Agent 1: Topic Intelligence

Single responsibility: Transform a raw topic into a structured research blueprint.

I/O:
  Reads:  state["topic"], state["target_audience"], state["geo"]
  Writes: state["topic_blueprint"], state["search_queries"]

Tools: LLM only (no external API calls).
"""
import logging
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from blog_pipeline.config import LLM_MODEL, LLM_TEMPERATURE
from blog_pipeline.state import PipelineState, TopicBlueprint, PipelineError

# ── System prompt ──────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a world-class SEO strategist and content intelligence expert.

Given a topic, target audience, and geographic focus, your job is to produce a
precise research blueprint that will guide a team of content researchers and writers.

Rules:
- search_queries must be ≥ 5, diverse, and cover different sub-angles of the topic
  (e.g. beginner questions, comparison queries, how-to queries, stat/data queries).
- primary_keywords: 3–5 terms the content MUST rank for.
- secondary_keywords: 5–10 supporting LSI/semantic keywords.
- semantic_clusters: 3–6 broad subtopic clusters to cover in the article.
- content_angle: a unique, differentiated hook — avoid generic angles.
- depth_required: judge based on search intent complexity.

Be specific. Avoid vague or overly broad outputs."""

HUMAN_TEMPLATE = """\
Topic: {topic}
Target Audience: {audience}
Geographic Focus: {geo}
Additional Intent Hint: {intent_hint}

Produce the research blueprint now."""

PROMPT = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", HUMAN_TEMPLATE),
])


logger = logging.getLogger(__name__)


def topic_intelligence_node(state: PipelineState) -> dict:
    """
    LangGraph node: Topic Intelligence Agent.

    Stateless — reads from state, returns a partial state update dict.
    """
    logger.info("--- Invoking Topic Intelligence Agent ---")
    llm = ChatOpenAI(model=LLM_MODEL, temperature=LLM_TEMPERATURE)
    structured_llm = llm.with_structured_output(TopicBlueprint)
    chain = PROMPT | structured_llm

    try:
        blueprint: TopicBlueprint = chain.invoke({
            "topic": state["topic"],
            "audience": state.get("target_audience") or "general readers",
            "geo": state.get("geo") or "global",
            "intent_hint": state.get("intent_hint") or "none",
        })
    except Exception as exc:
        error = PipelineError(
            agent="topic_intelligence",
            error=str(exc),
            context={"topic": state["topic"]},
        )
        return {"errors": [error]}

    return {
        "topic_blueprint": blueprint,
        # Seed Stage 2: reducer appends these to search_queries list
        "search_queries": blueprint.search_queries,
    }
