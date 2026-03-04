"""
graph.py — LangGraph StateGraph wiring for the Blog Pipeline.

Fan-out pattern (LangGraph 0.3+):
  Routing functions are passed to add_conditional_edges(), NOT added as nodes.
  They return list[Send] which LangGraph uses to dispatch parallel instances.

Full Flow:
  START -> topic_intelligence
         ->[research_router]-> N x search_agent (parallel)
         -> source_evaluator
         ->[scraper_router] -> K x scraper_agent (parallel)
         -> outline_agent
         ->[writer_router]  -> M x writer_agent  (parallel, one per section)
         -> assembler
         -> END
"""
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send
from langgraph.checkpoint.memory import MemorySaver

from blog_pipeline.state import PipelineState
from blog_pipeline.config import CHECKPOINTER_DB
from blog_pipeline.agents.topic_intelligence import topic_intelligence_node
from blog_pipeline.agents.research.search_agent import search_agent_node
from blog_pipeline.agents.research.source_evaluator import source_evaluator_node
from blog_pipeline.agents.research.scraper_agent import scraper_agent_node
from blog_pipeline.agents.outline import outline_node
from blog_pipeline.agents.writer import writer_router, writer_agent_node, assembler_node
from blog_pipeline.agents.editor import editor_node



# ==============================================================================
# Routing functions (fan-out via Send API)
# Passed to add_conditional_edges — NOT added as nodes themselves.
# ==============================================================================

def research_router(state: PipelineState) -> list[Send]:
    """
    Fan-out: dispatch one search_agent per search query in parallel.
    Called as an edge routing function after topic_intelligence completes.
    """
    queries = state.get("search_queries", [])
    if not queries:
        return [Send("source_evaluator", state)]
    return [Send("search_agent", {"query": q}) for q in queries]


def scraper_router(state: PipelineState) -> list[Send]:
    """
    Fan-out: dispatch one scraper_agent per scored source in parallel.
    Called as an edge routing function after source_evaluator completes.
    """
    sources = state.get("scored_sources", [])
    if not sources:
        return [Send("outline_agent", state)]
    return [Send("scraper_agent", {"source": src}) for src in sources]


# ==============================================================================
# Graph construction
# ==============================================================================

def build_graph(checkpointer=None):
    """
    Build and compile the blog pipeline StateGraph.

    Args:
        checkpointer: Optional LangGraph checkpointer.
                      Pass None for ephemeral runs (tests, etc.).
    Returns:
        Compiled CompiledStateGraph ready for .invoke() or .stream()
    """
    builder = StateGraph(PipelineState)

    # ── Register nodes ──────────────────────────────────────────────────────
    builder.add_node("topic_intelligence", topic_intelligence_node)
    builder.add_node("search_agent",       search_agent_node)
    builder.add_node("source_evaluator",   source_evaluator_node)
    builder.add_node("scraper_agent",      scraper_agent_node)
    builder.add_node("outline_agent",      outline_node)
    builder.add_node("writer_agent",       writer_agent_node)
    builder.add_node("assembler",          assembler_node)
    builder.add_node("editor_agent",       editor_node)


    # ── Wire edges ──────────────────────────────────────────────────────────
    builder.add_edge(START, "topic_intelligence")

    # Fan-out #1: research (N parallel search_agents)
    builder.add_conditional_edges(
        "topic_intelligence",
        research_router,
        ["search_agent", "source_evaluator"],
    )
    builder.add_edge("search_agent", "source_evaluator")

    # Fan-out #2: scraping (K parallel scraper_agents)
    builder.add_conditional_edges(
        "source_evaluator",
        scraper_router,
        ["scraper_agent", "outline_agent"],
    )
    # All scraper_agents complete -> outline_agent (fan-in via reducer)
    builder.add_edge("scraper_agent", "outline_agent")

    # Fan-out #3: writing (M parallel writer_agents, one per section)
    builder.add_conditional_edges(
        "outline_agent",
        writer_router,
        ["writer_agent"],
    )
    # All writer_agents complete -> assembler (fan-in via reducer)
    builder.add_edge("writer_agent", "assembler")
    builder.add_edge("assembler", "editor_agent")
    builder.add_edge("editor_agent", END)

    # ── Compile ─────────────────────────────────────────────────────────────
    return builder.compile(checkpointer=checkpointer)


def get_graph():
    """
    Return a compiled graph with MemorySaver (in-memory, sync-safe).
    Suitable for development, CLI, and testing.
    """
    return build_graph(checkpointer=MemorySaver())


async def get_graph_sqlite():
    """
    Return a compiled graph backed by AsyncSqliteSaver (durable/resumable).
    Use in async FastAPI or worker deployments.
    """
    from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
    saver = AsyncSqliteSaver.from_conn_string(CHECKPOINTER_DB)
    return build_graph(checkpointer=saver)
