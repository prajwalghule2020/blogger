"""
server.py — FastAPI Backend for the Blog Pipeline.

Exposes a streaming endpoint via Server-Sent Events (SSE) to provide
real-time updates on the pipeline's progress.
"""
import asyncio
import json
import logging
import uuid
import time
from typing import Optional, List, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from blog_pipeline.graph import get_graph

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Blog Research & Writing Pipeline API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track active pipelines for abort support
active_pipelines: Dict[str, bool] = {}

class GenerateRequest(BaseModel):
    topic: str
    audience: Optional[str] = "general audience"
    geo: Optional[str] = "global"
    intent_hint: Optional[str] = None

# Mapping node names to human-readable status updates
NODE_STATUS_MAP = {
    "topic_intelligence": "Analyzing topic and generating blueprint...",
    "search_agent": "Searching the web for relevant sources...",
    "source_evaluator": "Evaluating source credibility and relevance...",
    "scraper_agent": "Scraping and cleaning content from sources...",
    "outline_agent": "Synthesizing research into a structured outline...",
    "writer_agent": "Writing blog sections in parallel...",
    "assembler": "Assembling the full blog draft...",
    "editor_agent": "Performing final editorial review and SEO polish...",
}

@app.post("/api/generate")
async def generate_blog_stream(request: GenerateRequest):
    """
    Initiates the blog pipeline and streams status updates via SSE.
    """
    async def event_generator():
        thread_id = str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}
        
        initial_state = {
            "topic": request.topic,
            "target_audience": request.audience,
            "geo": request.geo,
            "intent_hint": request.intent_hint,
            "search_queries": [],
            "raw_urls": [],
            "scored_sources": [],
            "scraped_content": [],
            "blog_outline": None,
            "written_sections": [],
            "full_draft": None,
            "editor_report": None,
            "final_draft": None,
            "errors": [],
            "messages": [],
        }

        graph = get_graph()
        
        research_start_time = None
        research_duration = None
        
        # Immediate terminal log for user visibility
        print(f"\n[PIPELINE START] Thread ID: {thread_id} - Topic: {request.topic}")
        
        # Register this pipeline as active
        active_pipelines[thread_id] = True
        latest_final_draft = None
        
        try:
            # We use astream to get updates as nodes complete
            async for event in graph.astream(initial_state, config=config):
                # Check if pipeline was aborted
                if not active_pipelines.get(thread_id, True):
                    logger.info(f"Pipeline {thread_id} aborted by user.")
                    yield {
                        "event": "error",
                        "data": json.dumps({"error": "Pipeline terminated by user.", "thread_id": thread_id})
                    }
                    return
                
                # LangGraph event is a dict: {node_name: node_output_partial_state}
                for node_name, output in event.items():
                    status_text = NODE_STATUS_MAP.get(node_name, f"Completed: {node_name}")
                    
                    # Construct payload
                    payload = {
                        "node": node_name,
                        "status": status_text,
                        "thread_id": thread_id
                    }
                    
                    logger.info(f"LangGraph: Completed node '{node_name}'")
                    print(f"  [✓] DONE: {node_name.replace('_', ' ').title()}")
                    
                    # Timing for Research phase (from search_agent to source_evaluator)
                    if node_name == "search_agent" and research_start_time is None:
                        research_start_time = time.time()
                        print(f"\n  >>> Starting Research Phase...")
                    
                    if node_name == "source_evaluator":
                        if research_start_time:
                            research_duration = round(time.time() - research_start_time, 2)
                        print(f"  >>> Research Phase Completed in {research_duration}s\n")
                        payload["render_research_stats"] = True
                        payload["research_time"] = research_duration
                        if "scored_sources" in output:
                            payload["scored_sources"] = [s.model_dump() for s in output["scored_sources"]]

                    # Add search query count for topic_intelligence
                    if node_name == "topic_intelligence":
                        if "search_queries" in output:
                            payload["search_query_count"] = len(output["search_queries"])
                        if "topic_blueprint" in output:
                            bp = output["topic_blueprint"]
                            payload["blueprint"] = {
                                "search_intent": bp.search_intent if hasattr(bp, 'search_intent') else None,
                                "content_angle": bp.content_angle if hasattr(bp, 'content_angle') else None,
                            }

                    # Add specific data for key nodes
                    if node_name == "outline_agent" and "blog_outline" in output:
                        print(f"  >>> Outline Generated. Moving to Writing Phase...")
                        payload["data"] = output["blog_outline"].model_dump()
                    elif node_name == "editor_agent":
                        print(f"  >>> Editing & SEO Polish Complete.")
                        if "final_draft" in output:
                            payload["final_draft"] = output["final_draft"]
                            latest_final_draft = output["final_draft"]
                        if "editor_report" in output:
                            payload["editor_report"] = output["editor_report"].model_dump()

                    yield {
                        "event": "update",
                        "data": json.dumps(payload)
                    }

            # Final success message
            print(f"[PIPELINE COMPLETE] Thread ID: {thread_id}\n")
            complete_payload = {
                "status": "Pipeline completed successfully",
                "thread_id": thread_id
            }
            if latest_final_draft:
                complete_payload["final_draft"] = latest_final_draft
            yield {
                "event": "complete",
                "data": json.dumps(complete_payload)
            }

        except Exception as e:
            logger.error(f"Pipeline error: {str(e)}")
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e), "thread_id": thread_id})
            }
        finally:
            # Cleanup active pipeline tracking
            active_pipelines.pop(thread_id, None)

    return EventSourceResponse(event_generator())

@app.post("/api/abort/{thread_id}")
async def abort_pipeline(thread_id: str):
    """Signal a running pipeline to stop."""
    if thread_id in active_pipelines:
        active_pipelines[thread_id] = False
        return {"status": "abort_requested", "thread_id": thread_id}
    raise HTTPException(status_code=404, detail="Pipeline not found or already completed.")

@app.get("/api/stream")
async def generate_blog_stream_get(
    topic: str,
    audience: Optional[str] = "general audience",
    geo: Optional[str] = "global",
    intent_hint: Optional[str] = None
):
    """
    GET-based SSE endpoint for browser EventSource API.
    Same pipeline logic as POST /api/generate.
    """
    async def event_generator():
        thread_id = str(uuid.uuid4())
        config = {"configurable": {"thread_id": thread_id}}
        
        initial_state = {
            "topic": topic,
            "target_audience": audience,
            "geo": geo,
            "intent_hint": intent_hint,
            "search_queries": [],
            "raw_urls": [],
            "scored_sources": [],
            "scraped_content": [],
            "blog_outline": None,
            "written_sections": [],
            "full_draft": None,
            "editor_report": None,
            "final_draft": None,
            "errors": [],
            "messages": [],
        }

        graph = get_graph()
        
        research_start_time = None
        research_duration = None
        
        print(f"\n[PIPELINE START] Thread ID: {thread_id} - Topic: {topic}")
        
        active_pipelines[thread_id] = True
        latest_final_draft = None
        
        try:
            async for event in graph.astream(initial_state, config=config):
                if not active_pipelines.get(thread_id, True):
                    logger.info(f"Pipeline {thread_id} aborted by user.")
                    yield {
                        "event": "error",
                        "data": json.dumps({"error": "Pipeline terminated by user.", "thread_id": thread_id})
                    }
                    return
                
                for node_name, output in event.items():
                    status_text = NODE_STATUS_MAP.get(node_name, f"Completed: {node_name}")
                    
                    payload = {
                        "node": node_name,
                        "status": status_text,
                        "thread_id": thread_id
                    }
                    
                    logger.info(f"LangGraph: Completed node '{node_name}'")
                    print(f"  [✓] DONE: {node_name.replace('_', ' ').title()}")
                    
                    if node_name == "search_agent" and research_start_time is None:
                        research_start_time = time.time()
                    
                    if node_name == "source_evaluator":
                        if research_start_time:
                            research_duration = round(time.time() - research_start_time, 2)
                        payload["research_time"] = research_duration
                        if "scored_sources" in output:
                            payload["scored_sources"] = [s.model_dump() for s in output["scored_sources"]]

                    if node_name == "topic_intelligence":
                        if "search_queries" in output:
                            payload["search_query_count"] = len(output["search_queries"])
                        if "topic_blueprint" in output:
                            bp = output["topic_blueprint"]
                            payload["blueprint"] = {
                                "search_intent": bp.search_intent if hasattr(bp, 'search_intent') else None,
                                "content_angle": bp.content_angle if hasattr(bp, 'content_angle') else None,
                            }

                    if node_name == "outline_agent" and "blog_outline" in output:
                        payload["data"] = output["blog_outline"].model_dump()
                    elif node_name == "editor_agent":
                        if "final_draft" in output:
                            payload["final_draft"] = output["final_draft"]
                            latest_final_draft = output["final_draft"]
                        if "editor_report" in output:
                            payload["editor_report"] = output["editor_report"].model_dump()

                    yield {
                        "event": "update",
                        "data": json.dumps(payload)
                    }

            print(f"[PIPELINE COMPLETE] Thread ID: {thread_id}\n")
            complete_payload = {
                "status": "Pipeline completed successfully",
                "thread_id": thread_id
            }
            if latest_final_draft:
                complete_payload["final_draft"] = latest_final_draft
            yield {
                "event": "complete",
                "data": json.dumps(complete_payload)
            }

        except Exception as e:
            logger.error(f"Pipeline error: {str(e)}")
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e), "thread_id": thread_id})
            }
        finally:
            active_pipelines.pop(thread_id, None)

    return EventSourceResponse(event_generator())

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
