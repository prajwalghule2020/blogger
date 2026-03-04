"use client"

import { useState } from "react";
import { Search, Activity, Network, Edit3, Bot, Play, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Hero() {
    const [isFocused, setIsFocused] = useState(false);
    const [inputValue, setInputValue] = useState("");

    return (
        <div className="flex flex-col items-center w-full max-w-5xl">
            {/* Attractive tagline */}
            <div className="flex items-center gap-4 mb-2">
                <span className="h-px w-12 bg-gradient-to-r from-transparent to-gray-400" />
                <p className="text-sm sm:text-base font-medium tracking-wide text-gray-500 uppercase">
                    AI-Powered Content Intelligence
                </p>
                <span className="h-px w-12 bg-gradient-to-l from-transparent to-gray-400" />
            </div>

            <div className="relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl">
                <video
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                >
                    <source src="/herovdo.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                {/* Overlay UI */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">

                    {/* Top Pills */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <button className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full text-[13px] font-medium text-gray-900 shadow-md">
                            <Network className="w-4 h-4" />
                            Topic Intelligence
                        </button>
                        <button className="flex items-center gap-2 border border-black/10 px-5 py-2.5 rounded-full text-[13px] font-medium text-black/60 hover:bg-black/5 transition-colors backdrop-blur-sm">
                            <Search className="w-4 h-4" />
                            Search & Evaluate
                        </button>
                        <button className="flex items-center gap-2 border border-black/10 px-5 py-2.5 rounded-full text-[13px] font-medium text-black/60 hover:bg-black/5 transition-colors backdrop-blur-sm">
                            <Activity className="w-4 h-4" />
                            Deep Scrape
                        </button>
                        <button className="flex items-center gap-2 border border-black/10 px-5 py-2.5 rounded-full text-[13px] font-medium text-black/60 hover:bg-black/5 transition-colors backdrop-blur-sm">
                            <Edit3 className="w-4 h-4" />
                            Write & Assemble
                        </button>
                    </div>

                    {/* Main Card */}
                    <div className="w-[700px] max-w-full rounded-[1.5rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-white/40 bg-white/40 backdrop-blur-2xl backdrop-saturate-150">
                        {/* Top Section - Solid White */}
                        <div className="bg-white p-7 pb-6 rounded-t-[1.5rem]">
                            <div className="relative mb-6">
                                {/* The actual interactive input */}
                                <textarea
                                    className="w-full text-[16px] text-gray-800 leading-[1.6] font-medium bg-transparent border-none outline-none resize-none min-h-[80px] z-10 relative"
                                    placeholder={isFocused ? "Enter your prompt..." : ""}
                                    value={inputValue}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(inputValue.length > 0)}
                                    onChange={(e) => setInputValue(e.target.value)}
                                />

                                {/* The animated placeholder that disappears on focus/typing */}
                                {!isFocused && inputValue.length === 0 && (
                                    <div className="absolute top-0 left-0 pointer-events-none text-[16px] text-gray-800 leading-[1.6] font-medium w-full h-full">
                                        Enter the topic here e.g. {" "}
                                        <span className="inline-flex">
                                            <span className="text-[#3B82F6] font-bold overflow-hidden whitespace-nowrap border-r-2 border-[#3B82F6] animate-[typing_4s_steps(40,end)_infinite,blink_.75s_step-end_infinite] max-w-fit pr-1">
                                                The Future of Autonomous AI Agents in 2026
                                            </span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="inline-flex items-center gap-5 px-3 py-1.5 rounded-md border border-gray-200">
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-900">
                                    <Bot className="w-3.5 h-3.5" />
                                    Orchestrator AI
                                </div>
                                <div className="text-[11px] font-bold text-gray-400">Status <span className="font-semibold mix-blend-multiply text-green-600">Writing</span></div>
                                <div className="text-[11px] font-bold text-gray-400">Target: Tech Leads</div>
                                <div className="text-[11px] font-bold text-gray-400">Est: 2000 Words</div>
                            </div>
                            {/* Define the keyframes for the typing animation locally if not in tailwind config */}
                            <style dangerouslySetInnerHTML={{
                                __html: `
                          @keyframes typing {
                            from { width: 0 }
                            to { width: 100% }
                          }
                          @keyframes blink {
                            from, to { border-color: transparent }
                            50% { border-color: #3B82F6; }
                          }
                        `}} />
                        </div>

                        {/* Bottom Section - Translucent */}
                        <div className="px-7 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Button className="rounded-full bg-[#18181B] text-white hover:bg-black w-[100px] h-9 text-[13px] font-medium flex items-center justify-center gap-2">
                                    Start
                                    <Play className="w-3.5 h-3.5 fill-white" />
                                </Button>

                            </div>


                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
}
