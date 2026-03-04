"""
app.py — Streamlit Frontend for the Blog Research & Writing Pipeline.
"""
import streamlit as st
import requests
import json
import sseclient
import time

st.set_page_config(
    page_title="AI Blog Writer",
    page_icon="✍️",
    layout="wide"
)

# ── Sidebar Configuration ─────────────────────────────────────────────────────
st.sidebar.title("Configuration")
audience = st.sidebar.text_input("Target Audience", value="fitness beginners")
geo = st.sidebar.text_input("Geographic Focus", value="US")
intent_hint = st.sidebar.selectbox("Intent Hint (Optional)", ["", "how-to", "comparison", "listicle", "informational"])

st.sidebar.markdown("---")
st.sidebar.info(
    "This tool uses a multi-agent LangGraph pipeline to research, "
    "outline, and write a full blog post."
)

# ── Main UI ──────────────────────────────────────────────────────────────────
st.title("✍️ AI Blog Research & Writing Pipeline")
st.markdown("Enter a topic below to start the automated research and writing process.")

topic = st.text_input("Blog Topic", placeholder="e.g., best protein powders for beginners")

if st.button("🚀 Generate Blog Post", use_container_width=True):
    if not topic:
        st.error("Please enter a topic.")
    else:
        # Containers for real-time updates
        progress_container = st.container()
        status_text = progress_container.empty()
        progress_bar = progress_container.progress(0)
        
        # Results container (hidden until complete)
        results_container = st.container()
        
        # Start the backend request
        payload = {
            "topic": topic,
            "audience": audience,
            "geo": geo,
            "intent_hint": intent_hint if intent_hint else None
        }
        
        try:
            # We use stream=True for SSE
            response = requests.post(
                "http://localhost:8000/api/generate",
                json=payload,
                stream=True,
                timeout=300
            )
            
            client = sseclient.SSEClient(response)
            
            progress_map = {
                "topic_intelligence": 0.1,
                "search_agent": 0.25,
                "source_evaluator": 0.4,
                "scraper_agent": 0.55,
                "outline_agent": 0.7,
                "writer_agent": 0.85,
                "assembler": 0.95,
                "editor_agent": 1.0,
            }
            
            final_draft = ""
            outline_data = None
            editor_report = None
            research_time = None
            scored_sources = []
            
            start_time_gen = time.time()
            timer_placeholder = st.sidebar.empty()
            
            for event in client.events():
                # Live Timer Update
                elapsed_total = int(time.time() - start_time_gen)
                timer_placeholder.metric("Total Elapsed Time", f"{elapsed_total}s")
                
                if event.event == "update":
                    data = json.loads(event.data)
                    node = data.get("node")
                    status = data.get("status")
                    
                    # Update Progress
                    status_text.info(f"**Current Step:** {status}")
                    progress_bar.progress(progress_map.get(node, 0.5))
                    
                    # Capture intermediate data
                    if node == "outline_agent" and "data" in data:
                        outline_data = data["data"]
                    if node == "editor_agent":
                        if "final_draft" in data:
                            final_draft = data["final_draft"]
                        if "editor_report" in data:
                            editor_report = data["editor_report"]
                    
                    if "research_time" in data:
                        research_time = data["research_time"]
                    if "scored_sources" in data:
                        scored_sources = data["scored_sources"]
                        
                elif event.event == "complete":
                    status_text.success("✅ Blog generation complete!")
                    progress_bar.progress(1.0)
                    timer_placeholder.metric("Total Time", f"{int(time.time() - start_time_gen)}s")
                    break
                
                elif event.event == "error":
                    err_msg = json.loads(event.data).get("error", "Unknown error")
                    st.error(f"Pipeline Error: {err_msg}")
                    break

            # ── Display Results ──────────────────────────────────────────────────
            if final_draft:
                st.markdown("---")
                if research_time:
                    st.success(f"⏱️ Research completed in {research_time} seconds.")
                
                tab1, tab2, tab3, tab4 = st.tabs(["📄 Final Draft", "📋 Outline", "🛡️ Editorial Report", "🔗 Resources Used"])
                
                with tab1:
                    st.markdown(final_draft)
                    st.download_button(
                        label="Download Markdown",
                        data=final_draft,
                        file_name=f"blog_draft_{int(time.time())}.md",
                        mime="text/markdown"
                    )
                
                with tab2:
                    if outline_data:
                        st.subheader(outline_data.get("title"))
                        st.caption(outline_data.get("meta_description"))
                        for sec in outline_data.get("sections", []):
                            prefix = "##" if sec["level"] == "h2" else "###"
                            st.markdown(f"{prefix} {sec['heading']}")
                            for pt in sec.get("key_points", []):
                                st.write(f"- {pt}")
                    else:
                        st.warning("No outline data available.")
                
                with tab3:
                    if editor_report:
                        col1, col2, col3 = st.columns(3)
                        col1.metric("Overall Score", f"{editor_report['overall_score']}/100")
                        col2.metric("SEO Score", f"{editor_report['seo_audit']['seo_score']}/100")
                        col3.metric("Coherence", f"{editor_report['coherence_rating']}/10")
                        
                        st.markdown(f"**SEO Audit:** {'✅' if editor_report['seo_audit']['primary_kw_found'] else '❌'} Primary Keyword Found")
                        st.write(f"**Secondary KW Coverage:** {editor_report['seo_audit']['secondary_kws_coverage']*100:.0f}%")
                        
                        if editor_report['fact_check_notes']:
                            st.subheader("Fact-Check Notes")
                            for note in editor_report['fact_check_notes']:
                                st.write(f"- {note}")
                        
                        st.subheader("Tone & Feedback")
                        st.write(editor_report['tone_feedback'])
                    else:
                        st.warning("No editorial report available.")
                
                with tab4:
                    if scored_sources:
                        st.subheader("Research Sources & Authority Scores")
                        st.markdown("The following sources were used to ground the research for this blog post.")
                        
                        for src in scored_sources:
                            with st.expander(f"{src['url']}"):
                                col1, col2, col3 = st.columns(3)
                                col1.metric("Composite Score", f"{src['composite_score']:.2f}")
                                col2.metric("Credibility", f"{src['credibility_score']:.2f}")
                                col3.metric("Relevance", f"{src['relevance_score']:.2f}")
                                st.write(f"**Has Commercial Bias:** {'Yes' if src['has_commercial_bias'] else 'No'}")
                                st.link_button("View Source", src['url'])
                    else:
                        st.warning("No resource data available.")

        except requests.exceptions.ConnectionError:
            st.error("Could not connect to the backend server. Is server.py running?")
        except Exception as e:
            st.error(f"An error occurred: {str(e)}")
