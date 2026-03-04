"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Copy, CheckCircle2, ArrowLeft, Download, FileText, BarChart3, Shield, Globe } from "lucide-react"

export default function ResultPage() {
    const router = useRouter()
    const [draft, setDraft] = useState<string | null>(null)
    const [topic, setTopic] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [editorReport, setEditorReport] = useState<any>(null)
    const [sourcesCount, setSourcesCount] = useState<number>(0)

    useEffect(() => {
        const savedDraft = sessionStorage.getItem("pipeline_final_draft")
        const savedTopic = sessionStorage.getItem("pipeline_topic")
        const savedReport = sessionStorage.getItem("pipeline_editor_report")
        const savedSources = sessionStorage.getItem("pipeline_scored_sources")

        if (savedDraft) setDraft(savedDraft)
        if (savedTopic) setTopic(savedTopic)
        if (savedReport) {
            try { setEditorReport(JSON.parse(savedReport)) } catch { /* ignore */ }
        }
        if (savedSources) {
            try { setSourcesCount(JSON.parse(savedSources).length) } catch { /* ignore */ }
        }
    }, [])

    const handleCopy = async () => {
        if (!draft) return
        try {
            await navigator.clipboard.writeText(draft)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy text:", err)
        }
    }

    const handleDownload = () => {
        if (!draft) return
        const element = document.createElement("a");
        const file = new Blob([draft], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = `${topic?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'blog_post'}.md`;
        document.body.appendChild(element);
        element.click();
    }

    const handleStartNew = () => {
        sessionStorage.removeItem("pipeline_final_draft")
        sessionStorage.removeItem("pipeline_topic")
        sessionStorage.removeItem("pipeline_editor_report")
        sessionStorage.removeItem("pipeline_scored_sources")
        router.push("/command-center")
    }

    return (
        <div className="bg-background-dark font-sans text-text-main min-h-screen selection:bg-primary-custom selection:text-white flex flex-col">

            {/* Header */}
            <header className="flex items-center justify-between border-b border-border-dark px-8 py-4 bg-surface-dark sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleStartNew}
                        className="p-2 -ml-2 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text-main transition-colors group flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm hidden sm:block">New Pipeline</span>
                    </button>
                    <div className="h-6 w-px bg-border-dark hidden sm:block"></div>
                    <div>
                        <h2 className="text-text-main text-lg font-bold leading-tight">Generation Complete</h2>
                        <p className="text-text-muted text-xs font-medium truncate max-w-[300px] sm:max-w-md">{topic || "Blog Post Final Draft"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownload}
                        disabled={!draft}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-lighter hover:bg-[#2D333B] border border-border-dark text-text-main font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export .MD</span>
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={!draft}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-bold text-sm transition-all shadow-sm ${copied
                            ? "bg-success/10 border-success/30 text-success"
                            : "bg-primary-custom hover:bg-primary-custom/90 border-primary-custom text-white shadow-primary-custom/20 hover:shadow-primary-custom/30"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {copied ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                <span>Copy Draft</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center p-4 sm:p-8 overflow-y-auto gap-6">

                {/* Editorial Stats Bar */}
                {editorReport && (
                    <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-primary-custom/10 flex items-center justify-center shrink-0">
                                <BarChart3 className="w-5 h-5 text-primary-custom" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Overall Score</p>
                                <p className="text-xl font-black text-text-main">{editorReport.overall_score}<span className="text-sm text-text-muted font-medium">/100</span></p>
                            </div>
                        </div>
                        <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                                <Shield className="w-5 h-5 text-success" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">SEO Score</p>
                                <p className="text-xl font-black text-text-main">{editorReport.seo_audit?.seo_score ?? '—'}<span className="text-sm text-text-muted font-medium">/100</span></p>
                            </div>
                        </div>
                        <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                                <Globe className="w-5 h-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Sources Used</p>
                                <p className="text-xl font-black text-text-main">{sourcesCount || '—'}</p>
                            </div>
                        </div>
                        <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-primary-custom/10 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-primary-custom" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Coherence</p>
                                <p className="text-xl font-black text-text-main">{editorReport.coherence_rating ?? '—'}<span className="text-sm text-text-muted font-medium">/10</span></p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Document */}
                <div className="w-full max-w-4xl bg-white dark:bg-background-dark text-slate-800 dark:text-slate-200 rounded-xl shadow-xl border border-slate-200 dark:border-border-dark overflow-hidden flex flex-col min-h-[70vh]">

                    {/* Document Toolbar */}
                    <div className="flex items-center px-6 py-3 border-b border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-lighter text-sm text-slate-500 dark:text-text-muted font-mono justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>final_draft.md</span>
                        </div>
                        <div>
                            {draft ? `${draft.split(/\s+/).filter(w => w.length > 0).length} words` : 'Calculating...'}
                        </div>
                    </div>

                    {/* Document Content */}
                    <div className="p-8 sm:p-12 flex-1 overflow-y-auto">
                        {draft ? (
                            <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-p:leading-relaxed prose-a:text-primary-custom hover:prose-a:text-primary-custom/80 prose-img:rounded-xl">
                                <pre className="whitespace-pre-wrap font-sans bg-transparent p-0 m-0 border-0">{draft}</pre>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-text-muted gap-4 py-20">
                                <FileText className="w-16 h-16 opacity-20" />
                                <p className="text-lg">Loading draft content...</p>
                                <p className="text-sm opacity-60">If this persists, the pipeline may not have generated a final draft.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
