"""
state.py — Shared state schema and all Pydantic I/O models for the pipeline.

Design rules (per architectural spec):
  • All pipeline state lives here — agents are stateless internally.
  • Annotated[list, operator.add] reducers allow safe parallel fan-in writes.
  • Every agent reads/writes ONLY fields it owns (enforced by convention).
  • Stages: 1=TopicIntelligence, 2=Research, 3=Outline, 4=Writer
"""
import operator
from typing import Annotated, Any, Literal, Optional
from typing_extensions import TypedDict
from pydantic import BaseModel, Field
from langgraph.graph.message import add_messages


# ══════════════════════════════════════════════════════════════════════════════
# Stage 1 — Topic Intelligence I/O
# ══════════════════════════════════════════════════════════════════════════════

class TopicBlueprint(BaseModel):
    """Structured output of the Topic Intelligence Agent."""
    search_intent: Literal["informational", "commercial", "transactional"] = Field(
        description="Primary search intent behind the topic."
    )
    primary_keywords: list[str] = Field(
        description="3-5 core keywords the content must rank for.",
        min_length=1,
    )
    secondary_keywords: list[str] = Field(
        description="Supporting / LSI keywords to weave in naturally.",
        min_length=1,
    )
    semantic_clusters: list[str] = Field(
        description="Broad topic clusters / subtopics to cover.",
        min_length=1,
    )
    search_queries: list[str] = Field(
        description="5-10 diversified SERP queries for the Research Agent.",
        min_length=5,
    )
    content_angle: str = Field(
        description="Unique positioning angle that differentiates this post."
    )
    depth_required: Literal["overview", "deep-dive", "comparison"] = Field(
        description="Content depth level needed to satisfy search intent."
    )


# ══════════════════════════════════════════════════════════════════════════════
# Stage 2 — Research I/O
# ══════════════════════════════════════════════════════════════════════════════

class ScoredSource(BaseModel):
    """Output of the Source Evaluator Agent for a single URL."""
    url: str
    credibility_score: float = Field(ge=0.0, le=1.0)
    freshness_score: float = Field(ge=0.0, le=1.0)
    relevance_score: float = Field(ge=0.0, le=1.0)
    has_commercial_bias: bool
    composite_score: float = Field(ge=0.0, le=1.0)


class ScrapedDocument(BaseModel):
    """Output of the Scraper Agent for a single URL."""
    url: str
    composite_score: float
    content: str          # cleaned Markdown
    word_count: int
    error: Optional[str] = None   # populated if scrape failed


class PipelineError(BaseModel):
    """Standardized error entry appended by any agent on failure."""
    agent: str
    error: str
    context: dict[str, Any] = Field(default_factory=dict)


# ══════════════════════════════════════════════════════════════════════════════
# Sub-state schemas — used with the Send API for parallel nodes
# ══════════════════════════════════════════════════════════════════════════════

class SearchSubState(TypedDict):
    """Payload sent to each parallel search_agent instance."""
    query: str


class ScraperSubState(TypedDict):
    """Payload sent to each parallel scraper_agent instance."""
    source: ScoredSource


# ══════════════════════════════════════════════════════════════════════════════
# Stage 3 — Outline Agent I/O
# ══════════════════════════════════════════════════════════════════════════════

class OutlineSection(BaseModel):
    """One H2 or H3 section in the blog outline."""
    heading: str = Field(description="Section heading text (without # prefix).")
    level: Literal["h2", "h3"] = Field(description="Heading level.")
    parent: Optional[str] = Field(
        default=None,
        description="Parent H2 heading for H3 sections; None for top-level H2s."
    )
    key_points: list[str] = Field(
        description="3-5 key points / facts the section must cover.",
        min_length=1,
    )
    target_word_count: int = Field(
        description="Approximate word count target for this section.",
        ge=100,
    )
    source_urls: list[str] = Field(
        description="URLs from scraped_content most relevant to this section.",
        default_factory=list,
    )


class BlogOutline(BaseModel):
    """Full hierarchical blog outline produced by the Outline Agent."""
    title: str = Field(description="Final H1 blog post title, SEO-optimised.")
    meta_description: str = Field(
        description="SEO meta description, max 160 characters.",
    )
    intro_brief: str = Field(
        description="2-3 sentence brief for the introduction paragraph."
    )
    sections: list[OutlineSection] = Field(
        description="Ordered list of H2/H3 sections.",
        min_length=3,
    )
    conclusion_brief: str = Field(
        description="2-3 sentence brief for the conclusion paragraph."
    )
    estimated_total_words: int = Field(
        description="Sum of all section word targets + intro + conclusion.",
        ge=500,
    )


# ══════════════════════════════════════════════════════════════════════════════
# Stage 4 — Writer Agent I/O
# ══════════════════════════════════════════════════════════════════════════════

class WrittenSection(BaseModel):
    """One fully written blog section returned by a writer_agent instance."""
    heading: str
    level: Literal["h2", "h3"]
    content: str = Field(description="Markdown prose for this section.")
    word_count: int


class WriterSubState(TypedDict):
    """Payload sent to each parallel writer_agent instance via Send."""
    section: OutlineSection
    title: str                  # blog title (for context)
    content_angle: str          # from TopicBlueprint
    relevant_content: str       # pre-filtered scraped excerpts for this section


# ══════════════════════════════════════════════════════════════════════════════
# Global Pipeline State
# ══════════════════════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════════════════════
# Stage 5 — Editor Agent I/O
# ══════════════════════════════════════════════════════════════════════════════

class SEOAudit(BaseModel):
    """SEO audit results for the blog draft."""
    primary_kw_found: bool = Field(description="Is the primary keyword present?")
    secondary_kws_coverage: float = Field(description="Percentage of secondary keywords from the blueprint found in the draft (0.0 to 1.0).")
    missing_keywords: list[str] = Field(description="Keywords from the blueprint that are missing.")
    seo_score: int = Field(description="Calculated SEO score (0-100).", ge=0, le=100)


class EditorReport(BaseModel):
    """Evaluation report produced by the Editor Agent."""
    seo_audit: SEOAudit = Field(description="SEO metrics and audit details.")
    fact_check_notes: list[str] = Field(description="Notes on factual accuracy and grounding in research.")
    coherence_rating: int = Field(description="Rating for flow and coherence (1-10).", ge=1, le=10)
    tone_feedback: str = Field(description="Feedback on tone and consistency.")
    overall_score: int = Field(description="Overall editorial score (0-100).", ge=0, le=100)


class PipelineState(TypedDict):
    """
    The single shared state object threaded through the entire graph.

    Reducer rules:
      • Annotated[list, operator.add]  →  multiple nodes can append without clobbering
      • Plain fields                   →  last-writer-wins (single-writer nodes only)
    """
    # ── User inputs ─────────────────────────────────────────────────────────
    topic: str
    target_audience: Optional[str]
    geo: Optional[str]
    intent_hint: Optional[str]

    # ── Stage 1: Topic Intelligence ──────────────────────────────────────────
    topic_blueprint: Optional[TopicBlueprint]

    # ── Stage 2: Research ───────────────────────────────────────────────────
    search_queries: Annotated[list[str], operator.add]
    raw_urls: Annotated[list[str], operator.add]
    scored_sources: Annotated[list[ScoredSource], operator.add]
    scraped_content: Annotated[list[ScrapedDocument], operator.add]

    # ── Stage 3: Outline ─────────────────────────────────────────────────────
    blog_outline: Optional[BlogOutline]

    # ── Stage 4: Writer ──────────────────────────────────────────────────────
    written_sections: Annotated[list[WrittenSection], operator.add]  # fan-in reducer
    full_draft: Optional[str]              # final assembled Markdown

    # ── Stage 5: Editor ──────────────────────────────────────────────────────
    editor_report: Optional[EditorReport]
    final_draft: Optional[str]             # polished version by Editor

    # ── Cross-cutting ────────────────────────────────────────────────────────
    errors: Annotated[list[PipelineError], operator.add]
    messages: Annotated[list, add_messages]
