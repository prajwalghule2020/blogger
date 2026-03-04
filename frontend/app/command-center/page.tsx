"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Sparkles, Bell, Search, ArrowRight, Settings2, ChevronDown, Users, Key, Info, User, PenTool, MousePointerClick, BarChart3 } from "lucide-react"

export default function CommandCenterPage() {
    const router = useRouter()
    const [topic, setTopic] = useState("")
    const [audience, setAudience] = useState("")
    const [intentHint, setIntentHint] = useState("")

    const handleInitialize = () => {
        if (!topic.trim()) return;
        const params = new URLSearchParams()
        params.set("topic", topic)
        if (audience.trim()) params.set("audience", audience)
        if (intentHint.trim()) params.set("intent", intentHint)

        router.push(`/orchestration?${params.toString()}`)
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-slate-100 min-h-screen">
            <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">

                {/* Header */}
                <header className="sticky top-0 z-50 w-full border-b border-border-dark dark:border-slate-800 bg-background-dark px-6 lg:px-20 py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">Writer<span className="text-primary-custom">OS</span></span>
                        </div>

                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#" className="text-sm font-medium text-slate-400 hover:text-primary-custom transition-colors">Dashboard</a>
                            <a href="#" className="text-sm font-medium text-slate-400 hover:text-primary-custom transition-colors">Templates</a>
                            <a href="#" className="text-sm font-medium text-slate-400 hover:text-primary-custom transition-colors">History</a>
                        </nav>

                        <div className="flex items-center gap-4">
                            <button className="p-2 text-slate-400 hover:text-white transition-colors">
                                <Bell className="w-5 h-5" />
                            </button>
                            <div className="h-8 w-[1px] bg-slate-800 mx-2"></div>
                            <div className="flex items-center gap-3 pl-2">
                                <Avatar className="size-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                                    <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvSGirQJLvPTJPivPy6cy58A9wq_lKWXlmvJ7GKlcZmvlKk6I_zRB1E-o7l89QMGke4BEePhlLTG47V1GGhhiY8y3E7kqWeFsQIVQxI54VoxDfs1wG1NcHRtwX71zZiu5a9PZH6ZoAM6sYnTnOuLmQvzo69lAHENGS5qmfZT3cp_MgFwUV4gahJQzWYTyiSUk_-PVNzfB996-pVmHTnSRqVcvvzX81Z4t2hivppoTjC135sgVFHv-68qKO8Kf27swC7wf9CfvPAMPt" className="object-cover" />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col items-center bg-background-dark">
                    <div className="w-full max-w-4xl px-6 py-16 lg:py-24 flex flex-col items-center text-center">

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-custom/10 border border-primary-custom/20 text-primary-custom text-xs font-bold uppercase tracking-wider mb-8">
                            <Sparkles className="w-3 h-3" />
                            Next-Gen AI Writing Engine
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
                            Command <span className="text-primary-custom">Center</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12">
                            Turn a single spark of an idea into a comprehensive, SEO-optimized blog post using deep research pipelines.
                        </p>

                        {/* Search Input Panel */}
                        <div className="w-full max-w-3xl bg-surface-dark border border-border-dark dark:border-[#30363d] rounded-2xl p-2 mb-8">
                            <div className="flex flex-col md:flex-row gap-2">
                                <div className="flex-1 flex items-center px-4 py-3 gap-3">
                                    <Search className="w-6 h-6 text-slate-400" />
                                    <Input
                                        type="text"
                                        placeholder="Enter your blog topic (e.g. The Future of Quantum Computing in SaaS)"
                                        className="w-full bg-transparent border-none focus-visible:ring-0 shadow-none text-slate-100 placeholder:text-slate-500 text-lg sm:text-lg h-auto px-0"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleInitialize();
                                            }
                                        }}
                                    />
                                </div>
                                <Button
                                    onClick={handleInitialize}
                                    disabled={!topic.trim()}
                                    className="bg-primary-custom hover:bg-primary-custom/90 text-white font-bold py-6 px-8 rounded-xl transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span>Initialize Pipeline</span>
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Advanced Options Details */}
                        <div className="w-full max-w-3xl">
                            <details className="group bg-surface-dark border border-border-dark dark:border-[#30363d] rounded-2xl overflow-hidden transition-all duration-300">
                                <summary className="flex cursor-pointer items-center justify-between p-6 list-none select-none hover:bg-white/5 data-[state=open]:border-b data-[state=open]:border-slate-700/50">
                                    <div className="flex items-center gap-3">
                                        <Settings2 className="w-5 h-5 text-primary-custom group-open:-rotate-180 transition-transform duration-300" />
                                        <span className="text-slate-200 font-semibold">Advanced Generation Options</span>
                                    </div>
                                    <ChevronDown className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform duration-300" />
                                </summary>

                                <div className="p-6 pt-6 border-t border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-slate-300">Target Audience</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                            <Input
                                                type="text"
                                                placeholder="e.g. Tech Founders, CTOs"
                                                className="w-full bg-background-dark border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 focus-visible:border-primary-custom focus-visible:ring-1 focus-visible:ring-primary-custom transition-colors"
                                                value={audience}
                                                onChange={(e) => setAudience(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-slate-300">Primary Keyword Focus</label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                            <Input
                                                type="text"
                                                placeholder="e.g. quantum cloud security"
                                                className="w-full bg-background-dark border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 focus-visible:border-primary-custom focus-visible:ring-1 focus-visible:ring-primary-custom transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className="text-sm font-medium text-slate-300">Custom Writing Instructions</label>
                                        <Textarea
                                            placeholder="e.g. Maintain a professional yet provocative tone. Use industry-specific terminology. Include a case study reference from 2024."
                                            rows={4}
                                            className="w-full bg-background-dark border-slate-700 rounded-lg p-4 text-sm text-slate-100 focus-visible:border-primary-custom focus-visible:ring-1 focus-visible:ring-primary-custom transition-colors resize-none"
                                            value={intentHint}
                                            onChange={(e) => setIntentHint(e.target.value)}
                                        />
                                    </div>

                                    <div className="md:col-span-2 flex items-center justify-between py-2 px-4 bg-primary-custom/5 rounded-lg border border-primary-custom/10">
                                        <div className="flex items-center gap-2">
                                            <Info className="text-primary-custom w-4 h-4" />
                                            <span className="text-xs text-slate-400">These settings will influence the AI's research depth and narrative structure.</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <Checkbox className="border-slate-600 data-[state=checked]:bg-primary-custom data-[state=checked]:text-white focus-visible:ring-primary-custom/20 rounded" />
                                                <span className="text-xs text-slate-300 group-hover:text-white transition-colors">SEO Audit</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <Checkbox defaultChecked className="border-slate-600 data-[state=checked]:bg-primary-custom data-[state=checked]:text-white focus-visible:ring-primary-custom/20 rounded" />
                                                <span className="text-xs text-slate-300 group-hover:text-white transition-colors">Auto-citations</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>

                    </div>

                    {/* Feature Cards Grid */}
                    <div className="w-full max-w-7xl px-6 pb-20">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            <div className="bg-surface-dark border border-border-dark dark:border-[#30363d] p-8 rounded-2xl flex flex-col gap-4">
                                <div className="size-12 rounded-xl bg-slate-800 text-white flex items-center justify-center border border-slate-700">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Deep Research</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">Our AI crawls current web data, whitepapers, and news to provide factual backbone for your content.</p>
                            </div>

                            <div className="bg-surface-dark border border-border-dark dark:border-[#30363d] p-8 rounded-2xl flex flex-col gap-4">
                                <div className="size-12 rounded-xl bg-slate-800 text-white flex items-center justify-center border border-slate-700">
                                    <PenTool className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Brand Voice Sync</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">Adapts perfectly to your company's unique tone, whether it's academic, casual, or technical.</p>
                            </div>

                            <div className="bg-surface-dark border border-border-dark dark:border-[#30363d] p-8 rounded-2xl flex flex-col gap-4">
                                <div className="size-12 rounded-xl bg-slate-800 text-white flex items-center justify-center border border-slate-700">
                                    <MousePointerClick className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-white">SEO Mastery</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">Semantic analysis ensures your post is primed for Google's first page from the very first draft.</p>
                            </div>

                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="mt-auto py-8 border-t border-slate-800 text-center text-slate-500 text-sm bg-background-dark">
                    <p>© 2024 WriterOS. Powered by Advanced Language Models.</p>
                </footer>

            </div>
        </div>
    )
}
