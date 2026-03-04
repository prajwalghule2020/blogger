"""
main.py — Entry point for the Blog Research & Writing Pipeline.

Usage:
    python main.py --topic "best protein powders for beginners" --audience "fitness beginners" --geo "US"

The pipeline runs Topic Intelligence → Research (Search → Evaluate → Scrape)
and prints a summary of all scraped sources at the end.
"""
import argparse
import json
import uuid

from blog_pipeline.graph import get_graph


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Automated Blog Research & Writing Pipeline (LangGraph)"
    )
    parser.add_argument(
        "--topic", required=True,
        help="The raw blog topic or keyword to research."
    )
    parser.add_argument(
        "--audience", default=None,
        help="Target audience (e.g. 'fitness beginners', 'enterprise CTOs')."
    )
    parser.add_argument(
        "--geo", default=None,
        help="Geographic focus (e.g. 'US', 'UK', 'global')."
    )
    parser.add_argument(
        "--intent-hint", default=None,
        help="Optional intent hint (e.g. 'how-to', 'comparison', 'listicle')."
    )
    return parser.parse_args()


def display_results(final_state: dict) -> None:
    sep = "─" * 70

    print(f"\n{sep}")
    print("  TOPIC BLUEPRINT")
    print(sep)
    bp = final_state.get("topic_blueprint")
    if bp:
        print(f"  Search Intent  : {bp.search_intent}")
        print(f"  Content Angle  : {bp.content_angle}")
        print(f"  Depth Required : {bp.depth_required}")
        print(f"  Primary KWs    : {', '.join(bp.primary_keywords)}")
        print(f"  Secondary KWs  : {', '.join(bp.secondary_keywords)}")
        print(f"  Clusters       : {', '.join(bp.semantic_clusters)}")
        print(f"  Search Queries : {len(bp.search_queries)} generated")

    outline = final_state.get("blog_outline")
    if outline:
        print(f"\n{sep}")
        print("  BLOG OUTLINE")
        print(sep)
        print(f"  Title          : {outline.title}")
        print(f"  Meta Desc      : {outline.meta_description}")
        print(f"  Sections       : {len(outline.sections)}")
        print(f"  Est. Total Words: {outline.estimated_total_words}")
        print("\n  Structure:")
        for sec in outline.sections:
            prefix = "  - " if sec.level == "h2" else "    * "
            print(f"{prefix}{sec.heading} ({sec.target_word_count} words)")

    print(f"\n{sep}")
    print("  RESEARCH RESULTS")
    print(sep)
    urls = final_state.get("raw_urls", [])
    sources = final_state.get("scored_sources", [])
    scraped = final_state.get("scraped_content", [])
    errors = final_state.get("errors", [])

    print(f"  Raw URLs collected : {len(urls)}")
    print(f"  Scored sources     : {len(sources)}")
    print(f"  Successfully scraped: {len([s for s in scraped if not s.error])}")
    print(f"  Scrape errors      : {len([s for s in scraped if s.error])}")

    if sources:
        print(f"\n  Top Scored Sources:")
        for i, src in enumerate(sources[:5], 1):
            print(f"    {i}. [{src.composite_score:.2f}] {src.url}")

    if scraped:
        print(f"\n  Scraped Documents:")
        for s in scraped:
            status = "✓" if not s.error else "✗"
            print(f"    {status} {s.url[:60]}... ({s.word_count} words)")

    if errors:
        print(f"\n  Pipeline Errors ({len(errors)}):")
        for e in errors:
            # Hide some internal routing messages if they aren't real errors
            if "Draft saved to" in e.error:
                continue
            print(f"    [{e.agent}] {e.error[:100]}")

    draft = final_state.get("full_draft")
    if draft:
        print(f"\n{sep}")
        print("  FINAL BLOG DRAFT (Preview)")
        print(sep)
        # Show first 500 chars
        preview = draft[:1000] + "..." if len(draft) > 1000 else draft
        print(preview)

        # Look for the save path in errors (we stashed it there in assembler)
        save_path = "output/"
        for e in errors:
            if "Draft saved to" in e.error:
                save_path = e.error.replace("Draft saved to ", "")
        print(f"\n📄 Full draft saved to: {save_path}")

    report = final_state.get("editor_report")
    if report:
        print(f"\n{sep}")
        print("  EDITORIAL AUDIT")
        print(sep)
        print(f"  Overall Score  : {report.overall_score}/100")
        print(f"  SEO Score      : {report.seo_audit.seo_score}/100")
        print(f"  Coherence      : {report.coherence_rating}/10")
        print(f"  SEO Status     : {'✅' if report.seo_audit.primary_kw_found else '❌'} Primary KW")
        print(f"  KW Coverage    : {report.seo_audit.secondary_kws_coverage*100:.0f}% of secondary")
        if report.fact_check_notes:
            print("\n  Fact-Check Notes:")
            for note in report.fact_check_notes:
                print(f"    - {note}")
        print(f"\n  Tone Feedback  : {report.tone_feedback}")

    print(f"\n{sep}\n")


def main() -> None:
    args = parse_args()
    graph = get_graph()

    # Each run gets a unique thread_id for checkpointing / resumability
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    initial_state = {
        "topic": args.topic,
        "target_audience": args.audience,
        "geo": args.geo,
        "intent_hint": args.intent_hint,
        # Initialize list reducers as empty lists
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

    print(f"\n🚀 Starting Blog Pipeline")
    print(f"   Topic   : {args.topic}")
    print(f"   Audience: {args.audience or 'general'}")
    print(f"   Geo     : {args.geo or 'global'}")
    print(f"   Thread  : {thread_id}\n")

    print("⏳ Running pipeline (this may take 1-2 minutes)...\n")

    # Stream step-by-step updates for visibility
    for step in graph.stream(initial_state, config=config):
        node_name = list(step.keys())[0]
        print(f"  ✅ Completed: {node_name}")

    # Retrieve final state
    final_state = graph.get_state(config).values
    display_results(final_state)

    print(f"✅ Pipeline complete! Thread ID: {thread_id}")
    print(f"   (Resume later by passing --thread-id {thread_id} once resume is implemented)\n")


if __name__ == "__main__":
    main()
