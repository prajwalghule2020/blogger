"""
writer.py — Agent 4: Writer Agent + Assembler

Two components:
  writer_router    — routing function (fan-out via Send, one instance per section)
  writer_agent_node — writes one blog section from the outline + relevant research
  assembler_node   — fans-in all written sections → assembles full Markdown draft

I/O (writer_agent_node):
  Reads:  WriterSubState { section, title, content_angle, relevant_content }
  Writes: state["written_sections"] (list reducer — safe for parallel writes)

I/O (assembler_node):
  Reads:  state["written_sections"], state["blog_outline"]
  Writes: state["full_draft"], saves output/<thread_id>.md

Tools: LLM only (plain text output — no structured output needed for prose)
"""
import os
import logging
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from blog_pipeline.config import LLM_MODEL
from blog_pipeline.state import (
    PipelineState,
    WriterSubState,
    OutlineSection,
    WrittenSection,
    ScrapedDocument,
    PipelineError,
)
from langgraph.types import Send

# Max chars of scraped content passed per section to keep token usage reasonable
MAX_CONTENT_CHARS = 6000

# ── Writer system prompt ────────────────────────────────────────────────────────
WRITER_SYSTEM = """You are an expert blog writer specialising in {content_angle}.

Your task is to write ONE section of a blog post. Write in a clear, engaging,
authoritative tone appropriate for the target audience. Use Markdown formatting.

Rules:
- Write ONLY the body content for this section (no heading line — that is added separately).
- Hit the target word count as closely as possible (±15%).
- Use the research material to back up claims; do NOT fabricate statistics.
- Use short paragraphs (2–4 sentences). Add bullet lists where they aid clarity.
- Do NOT add a conclusion or summary at the end — this is just one section.
- Do NOT use filler phrases like "In this section we will..." or "As mentioned above..."."""

WRITER_HUMAN = """\
Blog Title: {title}
Section Heading: {heading}
Target Word Count: {target_words}
Key Points to Cover:
{key_points}

--- RELEVANT RESEARCH ---
{research}
--- END RESEARCH ---

Write the section content now (body only, no heading)."""

WRITER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", WRITER_SYSTEM),
    ("human", WRITER_HUMAN),
])


# ── Assembler prompt (for intro + conclusion prose) ────────────────────────────
ASSEMBLER_SYSTEM = """You are a blog editor. Write ONLY the requested paragraph(s).
Be concise, engaging, and on-brand with the rest of the article."""

INTRO_HUMAN = """\
Blog Title: {title}
Content Angle: {angle}
Intro Brief: {brief}
Write a compelling 3–5 sentence introduction paragraph (no heading):"""

CONCLUSION_HUMAN = """\
Blog Title: {title}
Conclusion Brief: {brief}
Sections Covered: {section_titles}
Write a 3–5 sentence conclusion paragraph (no heading):"""

INTRO_PROMPT = ChatPromptTemplate.from_messages([
    ("system", ASSEMBLER_SYSTEM), ("human", INTRO_HUMAN)
])
CONCLUSION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", ASSEMBLER_SYSTEM), ("human", CONCLUSION_HUMAN)
])


# ==============================================================================
# Helper utilities
# ==============================================================================

def _extract_relevant_content(
    scraped: list[ScrapedDocument],
    source_urls: list[str],
    max_chars: int = MAX_CONTENT_CHARS,
) -> str:
    """
    Filter scraped docs to only those matching source_urls for this section,
    then truncate to max_chars total. Falls back to top-scored docs if no
    specific URLs were mapped.
    """
    url_set = set(source_urls)
    relevant = [d for d in scraped if d.url in url_set and d.content]
    if not relevant:
        # Fallback: use top 2 by composite_score
        relevant = sorted(
            [d for d in scraped if d.content],
            key=lambda d: d.composite_score,
            reverse=True,
        )[:2]

    combined = "\n\n---\n\n".join(
        f"SOURCE: {d.url}\n{d.content}" for d in relevant
    )
    return combined[:max_chars]


def _heading_prefix(level: str) -> str:
    return "##" if level == "h2" else "###"


# ==============================================================================
# Routing function (fan-out)
# ==============================================================================

def writer_router(state: PipelineState) -> list[Send]:
    """
    Fan-out: dispatch one writer_agent instance per outline section in parallel.
    Passed to add_conditional_edges — NOT added as a node itself.
    """
    outline = state.get("blog_outline")
    if not outline or not outline.sections:
        return []

    scraped: list[ScrapedDocument] = state.get("scraped_content", [])
    blueprint = state.get("topic_blueprint")
    content_angle = blueprint.content_angle if blueprint else "general"

    return [
        Send("writer_agent", {
            "section": section,
            "title": outline.title,
            "content_angle": content_angle,
            "relevant_content": _extract_relevant_content(scraped, section.source_urls),
        })
        for section in outline.sections
    ]


# ==============================================================================
# Writer node (runs in parallel, one per section)
# ==============================================================================

def writer_agent_node(state: WriterSubState) -> dict:
    """
    LangGraph node: Writer Agent (Stage 4).

    Receives one section via Send API. Writes the section prose and returns
    it via the written_sections list reducer (safe for parallel fan-in).
    """
    logger = logging.getLogger(__name__)
    section: OutlineSection = state["section"]
    logger.info(f"--- Invoking Writer Agent for section: '{section.heading}' ---")

    llm = ChatOpenAI(model=LLM_MODEL, temperature=0.6)  # slightly creative
    chain = WRITER_PROMPT | llm

    try:
        response = chain.invoke({
            "content_angle": state["content_angle"],
            "title": state["title"],
            "heading": section.heading,
            "target_words": section.target_word_count,
            "key_points": "\n".join(f"- {kp}" for kp in section.key_points),
            "research": state["relevant_content"],
        })
        content: str = response.content.strip()
        written = WrittenSection(
            heading=section.heading,
            level=section.level,
            content=content,
            word_count=len(content.split()),
        )
        return {"written_sections": [written]}
    except Exception as exc:
        error = PipelineError(
            agent="writer_agent",
            error=str(exc),
            context={"heading": section.heading},
        )
        return {"written_sections": [], "errors": [error]}


# ==============================================================================
# Assembler node (fan-in — runs once after ALL writer_agents complete)
# ==============================================================================

def assembler_node(state: PipelineState) -> dict:
    """
    LangGraph node: Assembler (Stage 4 fan-in).

    Re-orders written sections to match outline order, writes intro + conclusion
    via LLM, assembles the full Markdown draft, and saves it to output/.
    """
    logger = logging.getLogger(__name__)
    logger.info("--- Invoking Assembler Agent ---")
    outline = state.get("blog_outline")
    written: list[WrittenSection] = state.get("written_sections", [])

    if not outline:
        error = PipelineError(
            agent="assembler",
            error="blog_outline is missing — cannot assemble draft.",
            context={},
        )
        return {"errors": [error]}

    llm = ChatOpenAI(model=LLM_MODEL, temperature=0.5)

    # ── Re-order sections to match outline ─────────────────────────────────
    order_map = {sec.heading: i for i, sec in enumerate(outline.sections)}
    ordered = sorted(written, key=lambda w: order_map.get(w.heading, 999))

    # ── Write intro ────────────────────────────────────────────────────────
    try:
        intro_resp = (INTRO_PROMPT | llm).invoke({
            "title": outline.title,
            "angle": state.get("topic_blueprint", {}) and
                     state["topic_blueprint"].content_angle or "",
            "brief": outline.intro_brief,
        })
        intro_text = intro_resp.content.strip()
    except Exception:
        intro_text = outline.intro_brief  # fallback to brief itself

    # ── Write conclusion ────────────────────────────────────────────────────
    section_titles = ", ".join(s.heading for s in outline.sections[:6])
    try:
        conc_resp = (CONCLUSION_PROMPT | llm).invoke({
            "title": outline.title,
            "brief": outline.conclusion_brief,
            "section_titles": section_titles,
        })
        conc_text = conc_resp.content.strip()
    except Exception:
        conc_text = outline.conclusion_brief

    # ── Assemble Markdown ──────────────────────────────────────────────────
    parts = [
        f"# {outline.title}",
        f"",
        f"*{outline.meta_description}*",
        f"",
        intro_text,
        f"",
    ]
    for sec in ordered:
        prefix = _heading_prefix(sec.level)
        parts.append(f"{prefix} {sec.heading}")
        parts.append(f"")
        parts.append(sec.content)
        parts.append(f"")

    parts += [
        f"## Conclusion",
        f"",
        conc_text,
    ]

    full_draft = "\n".join(parts)

    # ── Save to file ───────────────────────────────────────────────────────
    os.makedirs("output", exist_ok=True)
    import uuid
    filename = f"output/draft_{uuid.uuid4().hex[:8]}.md"
    try:
        with open(filename, "w", encoding="utf-8") as f:
            f.write(full_draft)
    except Exception:
        pass  # File save failure is non-fatal

    return {
        "full_draft": full_draft,
        # Stash filename in errors field for easy display pickup — non-critical
        "errors": [PipelineError(
            agent="assembler",
            error=f"Draft saved to {filename}",
            context={"word_count": len(full_draft.split()), "file": filename},
        )],
    }
