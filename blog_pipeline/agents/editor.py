"""
editor.py — Agent 5: Editor Agent

Single responsibility: Audit the assembled blog draft for SEO, factual accuracy,
and coherence, then polish it into the final version.

I/O:
  Reads:  state["full_draft"], state["topic_blueprint"], state["scraped_content"]
  Writes: state["editor_report"], state["final_draft"]

Tools: LLM only (Structured Output for Audit, Plain Text for Polish)
"""
import logging
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from blog_pipeline.config import LLM_MODEL, LLM_TEMPERATURE
from blog_pipeline.state import PipelineState, EditorReport, PipelineError, ScrapedDocument

# ── Audit Prompt ──────────────────────────────────────────────────────────────
AUDIT_SYSTEM = """You are a meticulous senior editor and SEO specialist.
Your task is to audit a blog draft against a topic blueprint and research material.

Evaluate the draft based on:
1. SEO: Is the primary keyword in the first paragraph? Are secondary keywords naturally integrated?
2. Fact-Checking: Are numbers, names, and technical specs consistent with the research?
3. Coherence: Do transitions between sections flow logically? Is the tone consistent?

Return a structured EditorReport."""

AUDIT_HUMAN = """\
TOPIC BLUEPRINT:
{blueprint}

RESEARCH SUMMARY:
{research}

BLOG DRAFT:
---
{draft}
---

Perform the audit and generate the report."""

# ── Polish Prompt ─────────────────────────────────────────────────────────────
POLISH_SYSTEM = """You are a master editor. Your goal is to take an audit report
and a blog draft, and produce a polished, high-quality final version.

Rules:
- Fix any factual inaccuracies noted in the audit.
- Improve transitions between sections to ensure smooth flow.
- Ensure all meta-data (H1, Meta Description) are properly formatted.
- Maintain the original Markdown structure (H2, H3 labels).
- Output is the FULL POLISHED DRAFT in Markdown."""

POLISH_HUMAN = """\
EDITOR AUDIT REPORT:
{report}

ORIGINAL DRAFT:
---
{draft}
---

Apply the editorial fixes and output the final version."""


def _build_research_summary(scraped: list[ScrapedDocument]) -> str:
    """Creates a very high-level summary of facts for the editor to check."""
    summary = []
    for doc in scraped:
        if doc.content:
            # Just take first 500 words of each for grounding data
            summary.append(f"SOURCE: {doc.url}\n{' '.join(doc.content.split()[:500])}")
    return "\n---\n".join(summary)


def editor_node(state: PipelineState) -> dict:
    logger = logging.getLogger(__name__)
    logger.info("--- Invoking Editor Agent ---")
    draft = state.get("full_draft")
    blueprint = state.get("topic_blueprint")
    scraped = state.get("scraped_content", [])

    if not draft or not blueprint:
        return {"errors": [PipelineError(agent="editor_agent", error="Missing draft or blueprint for editing", context={})]}

    llm = ChatOpenAI(model=LLM_MODEL, temperature=LLM_TEMPERATURE)
    
    # 1. Audit Pass
    try:
        research_context = _build_research_summary(scraped)
        audit_chain = ChatPromptTemplate.from_messages([("system", AUDIT_SYSTEM), ("human", AUDIT_HUMAN)]) | llm.with_structured_output(EditorReport)
        report: EditorReport = audit_chain.invoke({
            "blueprint": str(blueprint),
            "research": research_context,
            "draft": draft
        })
    except Exception as e:
        return {"errors": [PipelineError(agent="editor_agent", error=f"Audit failed: {str(e)}", context={})]}

    # 2. Polish Pass
    try:
        polish_chain = ChatPromptTemplate.from_messages([("system", POLISH_SYSTEM), ("human", POLISH_HUMAN)]) | llm
        polished_resp = polish_chain.invoke({
            "report": str(report),
            "draft": draft
        })
        final_draft = polished_resp.content
    except Exception as e:
        # If polish fails, we fall back to the original draft but include the error
        return {
            "editor_report": report,
            "final_draft": draft,
            "errors": [PipelineError(agent="editor_agent", error=f"Polishing failed, falling back to original: {str(e)}", context={})]
        }

    return {
        "editor_report": report,
        "final_draft": final_draft
    }
