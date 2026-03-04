"""
config.py — Centralized configuration for the Blog Pipeline.
All LLM and API settings are loaded from environment variables.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── LLM ────────────────────────────────────────────────────────────────────────
OPENAI_API_KEY: str = os.environ["OPENAI_API_KEY"]
LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.2"))

# ── Search ──────────────────────────────────────────────────────────────────────
TAVILY_API_KEY: str = os.environ["TAVILY_API_KEY"]
SEARCH_MAX_RESULTS: int = int(os.getenv("SEARCH_MAX_RESULTS", "10"))

# ── Scraper ─────────────────────────────────────────────────────────────────────
FIRECRAWL_API_KEY: str = os.environ["FIRECRAWL_API_KEY"]
SCRAPER_MIN_WORD_COUNT: int = int(os.getenv("SCRAPER_MIN_WORD_COUNT", "300"))

# ── Research stage tunables ─────────────────────────────────────────────────────
EVALUATOR_TOP_K: int = int(os.getenv("EVALUATOR_TOP_K", "8"))
EVALUATOR_MIN_SCORE: float = float(os.getenv("EVALUATOR_MIN_SCORE", "0.5"))
EVALUATOR_URL_LIMIT: int = int(os.getenv("EVALUATOR_URL_LIMIT", "30"))

# ── Checkpointer ────────────────────────────────────────────────────────────────
CHECKPOINTER_DB: str = os.getenv("CHECKPOINTER_DB", "blog_pipeline.db")
