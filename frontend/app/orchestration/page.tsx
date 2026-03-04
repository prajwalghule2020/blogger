"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Network, Timer, Bell, Settings, StopCircle, Check, RefreshCw, Hourglass, GitFork, Edit3, Verified, Terminal, Monitor, User, AlertTriangle } from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────
interface LogEntry {
    time: string
    type: string
    message: string
}

interface PhaseData {
    searchQueryCount: number | null
    blueprintIntent: string | null
    blueprintAngle: string | null
    researchTime: number | null
    sourcesEvaluated: number
    sourcesScraped: number
    outlineTitle: string | null
    outlineSectionCount: number | null
    estimatedWords: number | null
    editorScore: number | null
    seoScore: number | null
}

// ─── SSE Parser ─────────────────────────────────────────────────────
function parseSSEChunk(
    buffer: string,
    onEvent: (eventType: string, data: string) => void
): string {
    // SSE spec: events separated by blank lines (\n\n)
    // Each event has lines like "event: xxx" and "data: xxx"
    const parts = buffer.split("\n\n")
    // The last part might be incomplete, keep it in buffer
    const remainder = parts.pop() || ""

    for (const block of parts) {
        if (!block.trim()) continue
        const lines = block.split("\n")
        let eventType = "message"
        let dataLines: string[] = []

        for (const line of lines) {
            if (line.startsWith("event:")) {
                eventType = line.slice(6).trim()
            } else if (line.startsWith("data:")) {
                dataLines.push(line.slice(5).trim())
            } else if (line.startsWith(":")) {
                // SSE comment, ignore
            }
        }

        if (dataLines.length > 0) {
            onEvent(eventType, dataLines.join("\n"))
        }
    }

    return remainder
}

// ─── Main Component ─────────────────────────────────────────────────
function OrchestrationContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const topic = searchParams.get("topic") || ""
    const audience = searchParams.get("audience") || ""
    const intentHint = searchParams.get("intent") || ""

    const [activeStep, setActiveStep] = useState<number>(0)
    const [pipelineStatus, setPipelineStatus] = useState<"IDLE" | "ACTIVE" | "COMPLETED" | "ERROR">("IDLE")

    // Data artifacts
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [phaseData, setPhaseData] = useState<PhaseData>({
        searchQueryCount: null,
        blueprintIntent: null,
        blueprintAngle: null,
        researchTime: null,
        sourcesEvaluated: 0,
        sourcesScraped: 0,
        outlineTitle: null,
        outlineSectionCount: null,
        estimatedWords: null,
        editorScore: null,
        seoScore: null,
    })

    const [finalDraft, setFinalDraft] = useState<string | null>(null)
    const [editorReport, setEditorReport] = useState<any>(null)
    const [scoredSources, setScoredSources] = useState<any[]>([])
    const [blogOutline, setBlogOutline] = useState<any>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [threadId, setThreadId] = useState<string | null>(null)

    const logsEndRef = useRef<HTMLDivElement>(null)
    const eventSourceRef = useRef<EventSource | null>(null)

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [logs])

    const addLog = useCallback((type: string, message: string) => {
        setLogs(prev => [...prev, {
            time: new Date().toLocaleTimeString(),
            type,
            message
        }])
    }, [])

    // ─── Handle an SSE event ────────────────────────────────────────
    const handleSSEEvent = useCallback((eventType: string, rawData: string) => {
        let data: any
        try {
            data = JSON.parse(rawData)
        } catch {
            console.warn("Failed to parse SSE data:", rawData)
            return
        }

        if (data.thread_id && !threadId) {
            setThreadId(data.thread_id)
        }

        if (eventType === "update" && data.node) {
            const nodeName = data.node as string

            // Add to log
            addLog(
                nodeName.toUpperCase().replace(/_/g, " "),
                data.status || "Update received"
            )

            // Map node → active step
            if (nodeName === "topic_intelligence") {
                setActiveStep(1)
                setPhaseData(prev => ({
                    ...prev,
                    searchQueryCount: data.search_query_count ?? prev.searchQueryCount,
                    blueprintIntent: data.blueprint?.search_intent ?? prev.blueprintIntent,
                    blueprintAngle: data.blueprint?.content_angle ?? prev.blueprintAngle,
                }))
            } else if (nodeName === "search_agent") {
                setActiveStep(2)
            } else if (nodeName === "source_evaluator") {
                setActiveStep(2)
                if (data.scored_sources) {
                    setScoredSources(data.scored_sources)
                    setPhaseData(prev => ({
                        ...prev,
                        sourcesEvaluated: data.scored_sources.length,
                        researchTime: data.research_time ?? prev.researchTime,
                    }))
                }
            } else if (nodeName === "scraper_agent") {
                setActiveStep(3)
                setPhaseData(prev => ({
                    ...prev,
                    sourcesScraped: prev.sourcesScraped + 1,
                }))
            } else if (nodeName === "outline_agent") {
                setActiveStep(4)
                if (data.data && typeof data.data === "object") {
                    setBlogOutline(data.data)
                    setPhaseData(prev => ({
                        ...prev,
                        outlineTitle: data.data.title ?? prev.outlineTitle,
                        outlineSectionCount: data.data.sections?.length ?? prev.outlineSectionCount,
                        estimatedWords: data.data.estimated_total_words ?? prev.estimatedWords,
                    }))
                }
            } else if (nodeName === "writer_agent") {
                setActiveStep(5)
            } else if (nodeName === "assembler") {
                setActiveStep(5)
            } else if (nodeName === "editor_agent") {
                setActiveStep(6)
                if (data.final_draft) {
                    setFinalDraft(data.final_draft)
                }
                if (data.editor_report) {
                    setEditorReport(data.editor_report)
                    setPhaseData(prev => ({
                        ...prev,
                        editorScore: data.editor_report.overall_score ?? prev.editorScore,
                        seoScore: data.editor_report.seo_audit?.seo_score ?? prev.seoScore,
                    }))
                }
            }

        } else if (eventType === "complete") {
            setPipelineStatus("COMPLETED")
            setActiveStep(7)
            addLog("SYSTEM", "Pipeline completed successfully ✓")

            // Save to session storage
            const draftToSave = data.final_draft || finalDraft
            if (draftToSave) {
                sessionStorage.setItem("pipeline_final_draft", draftToSave)
            }
            sessionStorage.setItem("pipeline_topic", topic)

            if (editorReport) {
                sessionStorage.setItem("pipeline_editor_report", JSON.stringify(editorReport))
            }
            if (scoredSources.length > 0) {
                sessionStorage.setItem("pipeline_scored_sources", JSON.stringify(scoredSources))
            }

            // Navigate to result
            setTimeout(() => {
                router.push("/result")
            }, 1500) // Brief delay so user sees the completion state

        } else if (eventType === "error") {
            setPipelineStatus("ERROR")
            setErrorMessage(data.error || "Unknown pipeline error")
            addLog("ERROR", data.error || "Unknown pipeline error")
        }
    }, [addLog, topic, router, finalDraft, editorReport, scoredSources, threadId])

    // ─── Pipeline stream effect ─────────────────────────────────────
    useEffect(() => {
        if (!topic) return

        setPipelineStatus("ACTIVE")
        setActiveStep(1)
        addLog("SYSTEM", `Orchestration initialized for topic: "${topic}". Seeding agents...`)

        const timerInterval = setInterval(() => {
            setElapsedTime(prev => prev + 1)
        }, 1000)

        // Build the EventSource URL with query params
        const params = new URLSearchParams()
        params.set("topic", topic)
        params.set("audience", audience || "general audience")
        params.set("geo", "global")
        if (intentHint) params.set("intent_hint", intentHint)

        const eventSource = new EventSource(`http://localhost:8000/api/stream?${params.toString()}`)
        eventSourceRef.current = eventSource

        eventSource.addEventListener("update", (e) => {
            handleSSEEvent("update", e.data)
        })

        eventSource.addEventListener("complete", (e) => {
            handleSSEEvent("complete", e.data)
            eventSource.close()
            clearInterval(timerInterval)
        })

        eventSource.addEventListener("error", (e) => {
            // Check if this is an SSE error event with data
            const messageEvent = e as MessageEvent
            if (messageEvent.data) {
                handleSSEEvent("error", messageEvent.data)
            } else if (eventSource.readyState === EventSource.CLOSED) {
                // Connection closed normally (after a complete event)
                // Don't show error if we already completed
            } else {
                // Real connection error
                setPipelineStatus("ERROR")
                setErrorMessage("Connection to pipeline lost. The server may have stopped.")
                addLog("ERROR", "Connection to pipeline lost.")
            }
            eventSource.close()
            clearInterval(timerInterval)
        })

        return () => {
            clearInterval(timerInterval)
            eventSource.close()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topic, audience, intentHint])

    // ─── Terminate handler ──────────────────────────────────────────
    const handleTerminate = useCallback(async () => {
        // 1. Close the EventSource stream
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }

        // 2. Try to signal the backend
        if (threadId) {
            try {
                await fetch(`/api/abort/${threadId}`, { method: "POST" })
            } catch {
                // Best effort — backend may already be done
            }
        }

        setPipelineStatus("ERROR")
        setErrorMessage("Pipeline terminated by user.")
        addLog("SYSTEM", "Pipeline terminated by user.")
    }, [threadId, addLog])

    // ─── Helpers ────────────────────────────────────────────────────
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return {
            h: h.toString().padStart(2, '0'),
            m: m.toString().padStart(2, '0'),
            s: s.toString().padStart(2, '0')
        }
    }

    const timeStr = formatTime(elapsedTime)

    const getPhaseSubtext = (stepNum: number): string => {
        if (activeStep < stepNum) {
            // Not reached yet
            switch (stepNum) {
                case 1: return "Waiting..."
                case 2: return "Awaiting blueprint..."
                case 3: return "Waiting for candidates..."
                case 4: return "Structural planning phase"
                case 5: return "Content drafting engine"
                case 6: return "Final QC & SEO optimization"
                default: return "Pending"
            }
        }
        if (activeStep === stepNum && pipelineStatus === "ACTIVE") {
            // Currently active
            switch (stepNum) {
                case 1: return phaseData.searchQueryCount
                    ? `Generating blueprint... ${phaseData.searchQueryCount} queries created`
                    : "Analyzing topic..."
                case 2: return phaseData.sourcesEvaluated > 0
                    ? `Evaluating ${phaseData.sourcesEvaluated} sources${phaseData.researchTime ? ` (${phaseData.researchTime}s)` : ''}`
                    : "Searching the web..."
                case 3: return `Scraping source ${phaseData.sourcesScraped}/${phaseData.sourcesEvaluated || '?'}...`
                case 4: return "Structuring the outline..."
                case 5: return "Writing and assembling sections..."
                case 6: return "Performing editorial review & SEO polish..."
                default: return "Processing..."
            }
        }
        // Completed
        switch (stepNum) {
            case 1: return phaseData.searchQueryCount
                ? `Blueprint ready — ${phaseData.searchQueryCount} queries generated`
                : "Blueprint generated."
            case 2: return phaseData.researchTime
                ? `${phaseData.sourcesEvaluated} sources evaluated in ${phaseData.researchTime}s`
                : `${phaseData.sourcesEvaluated} sources evaluated`
            case 3: return `${phaseData.sourcesScraped} sources scraped successfully`
            case 4: return phaseData.outlineSectionCount
                ? `"${phaseData.outlineTitle}" — ${phaseData.outlineSectionCount} sections`
                : "Outline ready."
            case 5: return phaseData.estimatedWords
                ? `Draft assembled (~${phaseData.estimatedWords} words)`
                : "Draft assembled."
            case 6: return phaseData.editorScore
                ? `Score: ${phaseData.editorScore}/100 | SEO: ${phaseData.seoScore ?? '—'}/100`
                : "Review complete."
            default: return "Done"
        }
    }

    const renderStepIcon = (stepNum: number, Icon: any) => {
        if (activeStep > stepNum) {
            return (
                <div className="absolute -left-[13px] size-6 rounded-full bg-primary-custom flex items-center justify-center ring-4 ring-surface-dark shadow-sm shadow-primary-custom/30">
                    <Check className="text-white w-3 h-3 font-bold" />
                </div>
            )
        } else if (activeStep === stepNum && pipelineStatus === "ACTIVE") {
            return (
                <div className="absolute -left-[13px] size-6 rounded-full bg-surface-dark border-2 border-primary-custom flex items-center justify-center ring-4 ring-surface-dark shadow-sm shadow-primary-custom/20">
                    <RefreshCw className="text-primary-custom w-3 h-3 font-bold animate-spin" />
                </div>
            )
        } else {
            return (
                <div className="absolute -left-[13px] size-6 rounded-full bg-surface-lighter border border-border-dark flex items-center justify-center ring-4 ring-surface-dark">
                    <Icon className="text-text-muted w-3 h-3" />
                </div>
            )
        }
    }

    const renderPhaseStep = (stepNum: number, label: string, title: string, Icon: any, isLast: boolean = false) => (
        <div className={`group relative flex items-start gap-4 ${!isLast ? 'pb-8 border-l-2' : ''} ml-3 ${activeStep >= stepNum ? 'border-primary-custom' : 'border-border-dark'}`}>
            {renderStepIcon(stepNum, Icon)}
            <div className={`flex flex-col gap-1 pl-4 w-full ${activeStep < stepNum ? 'opacity-60' : ''}`}>
                <span className={`text-xs font-bold uppercase tracking-wider ${activeStep > stepNum ? 'text-success' : activeStep === stepNum ? 'text-primary-custom' : 'text-text-muted'}`}>{label}</span>
                <h3 className="text-text-main font-bold">{title}</h3>
                <p className="text-text-muted text-sm">{getPhaseSubtext(stepNum)}</p>
                {/* Progress bar for active steps */}
                {activeStep === stepNum && pipelineStatus === "ACTIVE" && (stepNum === 2 || stepNum === 3) && (
                    <div className="max-w-48 mt-2">
                        <Progress
                            value={stepNum === 3 && phaseData.sourcesEvaluated > 0
                                ? (phaseData.sourcesScraped / phaseData.sourcesEvaluated) * 100
                                : 50}
                            className="h-2 bg-background-dark border border-border-dark [&>div]:bg-primary-custom"
                        />
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <div className="bg-background-dark font-sans text-text-main min-h-screen selection:bg-primary-custom selection:text-white flex flex-col overflow-x-hidden">

            {/* Header */}
            <header className="flex items-center justify-between border-b border-border-dark px-8 py-4 bg-surface-dark sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="size-10 bg-primary-custom text-white rounded-lg flex items-center justify-center shadow-md shadow-primary-custom/20">
                        <Network className="w-6 h-6 scale-110" />
                    </div>
                    <div>
                        <h2 className="text-text-main text-lg font-bold leading-tight">Orchestrator AI</h2>
                        <p className="text-text-muted text-xs font-medium">Pipeline v2.4.0-Live • <span className="text-success font-bold">Stable</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-background-dark px-4 py-2 rounded-lg border border-border-dark">
                        <Timer className="text-primary-custom w-4 h-4" />
                        <div className="flex gap-1 font-mono text-lg font-bold">
                            <span className="text-text-main">{timeStr.h}</span><span className="text-text-muted">:</span>
                            <span className="text-text-main">{timeStr.m}</span><span className="text-text-muted">:</span>
                            <span className="text-primary-custom">{timeStr.s}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="size-10 flex items-center justify-center rounded-lg bg-surface-lighter hover:bg-[#2D333B] transition-colors border border-border-dark text-text-muted hover:text-text-main">
                            <Bell className="w-5 h-5" />
                        </button>
                        <button className="size-10 flex items-center justify-center rounded-lg bg-surface-lighter hover:bg-[#2D333B] transition-colors border border-border-dark text-text-muted hover:text-text-main">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                    <Avatar className="size-10 rounded-full bg-surface-lighter border border-border-dark overflow-hidden grayscale hover:grayscale-0 transition-all duration-300">
                        <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqhSbKIk6s9L-u1yHw8l7H8wHZIa77TQKd5iBwDyWeroSUX86suHq3bo4taxEZUBtaPprE6gbu8107N-UWQ7A-xl1eNvWc0W2AYplE5f9HAfUw1i-O49tIBBlmH8kbE2jcJR_FSW-9npYejhWjoe9RD4LOz4nMNq6hiIinkEb0gkweXx8fZJtjszsvYxU9Ig5FZ6oArSlA8gYzvtSTe2ISvL6O0BupRR3KuB3JzH3LmGtHW84chrmu3hTpT6n4UhntrKoQhIfxqtVI" alt="User Profile" />
                        <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-8 max-w-7xl mx-auto w-full grid grid-cols-12 gap-8">

                {/* Left Column: Pipeline Steps */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-text-main">Live Execution</h1>
                            <p className="text-text-muted mt-1 font-medium">Autonomous Research & Writing Pipeline</p>
                        </div>
                        <button
                            onClick={handleTerminate}
                            disabled={pipelineStatus !== "ACTIVE"}
                            className="flex items-center gap-2 px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg border border-danger/40 transition-all font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <StopCircle className="w-4 h-4" />
                            Terminate
                        </button>
                    </div>

                    <div className="rounded-xl p-6 flex flex-col gap-2 relative overflow-hidden bg-surface-dark border border-border-dark shadow-sm">
                        {renderPhaseStep(1, "Phase 01", "Topic Intelligence", Hourglass)}
                        {renderPhaseStep(2, "Phase 02", "Search & Evaluate", RefreshCw)}
                        {renderPhaseStep(3, "Phase 03", "Deep Scrape", Hourglass)}
                        {renderPhaseStep(4, "Phase 04", "Architect", GitFork)}
                        {renderPhaseStep(5, "Phase 05", "Write & Assemble", Edit3)}
                        {renderPhaseStep(6, "Phase 06", "Chief Editor", Verified, true)}
                    </div>

                    {/* Error Banner */}
                    {pipelineStatus === "ERROR" && errorMessage && (
                        <div className="rounded-xl p-4 bg-danger/10 border border-danger/30 flex items-start gap-3">
                            <AlertTriangle className="text-danger w-5 h-5 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-danger font-bold text-sm">Pipeline Error</p>
                                <p className="text-danger/80 text-sm mt-1">{errorMessage}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Console & Stats */}
                <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                                <Terminal className="text-primary-custom w-5 h-5" />
                                Live Feed Console
                            </h2>
                        </div>
                        <Badge variant="outline" className={`font-bold gap-1.5 px-3 py-1 ${pipelineStatus === 'COMPLETED' ? 'bg-success/10 text-success border-success/30' : pipelineStatus === 'ERROR' ? 'bg-danger/10 text-danger border-danger/30' : 'bg-warning/10 text-warning border-warning/30'}`}>
                            <span className={`size-2 rounded-full ${pipelineStatus === 'COMPLETED' ? 'bg-success' : pipelineStatus === 'ERROR' ? 'bg-danger' : 'bg-warning animate-pulse'}`}></span>
                            {pipelineStatus}
                        </Badge>
                    </div>

                    {/* Window Area */}
                    <div className="flex-1 min-h-[500px] rounded-xl flex flex-col overflow-hidden bg-background-dark border border-border-dark shadow-inner">
                        <div className="px-4 py-2 border-b border-border-dark bg-surface-lighter flex items-center justify-between">
                            <div className="flex gap-1.5">
                                <div className="size-2.5 rounded-full bg-danger/80"></div>
                                <div className="size-2.5 rounded-full bg-warning/80"></div>
                                <div className="size-2.5 rounded-full bg-success/80"></div>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold font-mono">
                                orchestrator_log_v2
                            </span>
                        </div>

                        <div className="p-6 flex flex-col gap-3 overflow-y-auto font-mono text-sm [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-background-dark [&::-webkit-scrollbar-thumb]:bg-border-dark [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-text-muted/50 max-h-[600px]">
                            {logs.map((log, index) => (
                                <div key={index} className="flex gap-3">
                                    <span className="text-text-muted/60 shrink-0">{log.time}</span>
                                    <span className={`font-bold shrink-0 ${log.type === 'ERROR' ? 'text-danger' : log.type === 'SYSTEM' ? 'text-primary-custom' : 'text-success'}`}>[{log.type}]</span>
                                    <span className="text-text-main">{log.message}</span>
                                </div>
                            ))}

                            {pipelineStatus === "ACTIVE" && (
                                <div className="flex gap-3 mt-4" ref={logsEndRef}>
                                    <span className="text-text-muted/60 shrink-0">{new Date().toLocaleTimeString()}</span>
                                    <div className="w-2 h-5 bg-primary-custom animate-pulse"></div>
                                </div>
                            )}
                            {(pipelineStatus === "COMPLETED" || pipelineStatus === "ERROR") && <div ref={logsEndRef} />}
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-5 rounded-lg flex flex-col gap-1 bg-surface-dark border border-border-dark hover:border-text-muted/30 transition-colors">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Sources Evaluated</span>
                            <span className="text-2xl font-black text-text-main">{phaseData.sourcesEvaluated || "-"}</span>
                        </div>
                        <div className="p-5 rounded-lg flex flex-col gap-1 bg-surface-dark border-2 border-primary-custom relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-20 text-primary-custom">
                                <Monitor className="w-8 h-8" />
                            </div>
                            <span className="text-[10px] font-bold text-primary-custom uppercase tracking-wider">Progress</span>
                            <span className="text-2xl font-black text-white">{pipelineStatus === "COMPLETED" ? "100%" : `${Math.min(Math.round((activeStep / 7) * 100), 99)}%`}</span>
                        </div>
                        <div className="p-5 rounded-lg flex flex-col gap-1 bg-surface-dark border border-border-dark hover:border-text-muted/30 transition-colors">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Words Planned</span>
                            <span className="text-2xl font-black text-text-main">{phaseData.estimatedWords || "-"}</span>
                        </div>
                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="mt-auto px-8 py-4 border-t border-border-dark bg-surface-dark">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
                            <span className="size-2 rounded-full bg-success"></span>
                            GPU Instance: NV-H100-x8
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
                            <span className="size-2 rounded-full bg-primary-custom"></span>
                            Model: GPT-4o-Turbo
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
                            <span className="size-2 rounded-full bg-text-muted"></span>
                            Lat: 42ms
                        </div>
                    </div>
                    <div className="text-xs text-text-muted/60 italic">
                        Pipeline auto-saves every 30 seconds
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default function OrchestrationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background-dark text-text-muted">Loading pipeline...</div>}>
            <OrchestrationContent />
        </Suspense>
    )
}
