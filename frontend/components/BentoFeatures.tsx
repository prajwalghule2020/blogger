"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
    Zap,
    BarChart3,
    Languages,
    Shield,
    Sparkles,
    Clock,
} from "lucide-react";

const features = [
    {
        icon: Sparkles,
        title: "Brand Voice AI",
        description:
            "Train the AI on your existing content. Every article sounds authentically you — your tone, your style, your perspective.",
        size: "large",
        dark: true,
    },
    {
        icon: BarChart3,
        title: "SEO Intelligence",
        description:
            "Real-time keyword analysis and SERP positioning built into every piece.",
        size: "small",
        dark: false,
    },
    {
        icon: Clock,
        title: "10x Faster",
        description:
            "What took days now takes minutes. Publish research-backed articles at unprecedented speed.",
        size: "small",
        dark: false,
    },
    {
        icon: Languages,
        title: "30+ Languages",
        description:
            "Generate native-quality content in any language. Expand your reach without translation overhead.",
        size: "small",
        dark: false,
    },
    {
        icon: Shield,
        title: "Fact-Checked Output",
        description:
            "Every claim is cross-referenced against source material. Full citation trails for transparency.",
        size: "small",
        dark: true,
    },
    {
        icon: Zap,
        title: "Live Collaboration",
        description:
            "Your team edits, comments, and refines in real-time. AI adapts to feedback instantly — the more you iterate, the smarter it gets.",
        size: "large",
        dark: false,
    },
];

export default function BentoFeatures() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });

    return (
        <section className="py-24 px-6 lg:px-8 bg-[#fafafa]" ref={ref}>
            <div className="max-w-6xl mx-auto">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <p className="text-xs font-bold tracking-[0.25em] uppercase text-gray-400 mb-3">
                        Capabilities
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                        Built for serious
                        <br />
                        <span className="text-gray-400">
                            content operations
                        </span>
                    </h2>
                </motion.div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {features.map((feature, index) => {
                        const isLarge = feature.size === "large";
                        const isDark = feature.dark;

                        return (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                                animate={
                                    isInView
                                        ? { opacity: 1, y: 0, scale: 1 }
                                        : {}
                                }
                                transition={{
                                    duration: 0.5,
                                    delay: 0.1 + index * 0.08,
                                }}
                                className={`group relative rounded-3xl p-8 transition-all duration-300 overflow-hidden
                                    ${isLarge ? "md:col-span-2" : "md:col-span-1"}
                                    ${isDark
                                        ? "bg-[#18181b] text-white hover:bg-[#1f1f23]"
                                        : "bg-white text-gray-900 hover:shadow-lg border border-gray-100"
                                    }
                                `}
                            >
                                {/* Subtle gradient hover overlay */}
                                <div
                                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl
                                    ${isDark
                                            ? "bg-gradient-to-br from-white/[0.03] to-transparent"
                                            : "bg-gradient-to-br from-gray-50/80 to-transparent"
                                        }`}
                                />

                                <div className="relative z-10">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5
                                        ${isDark
                                                ? "bg-white/10"
                                                : "bg-gray-100"
                                            }`}
                                    >
                                        <feature.icon
                                            className={`w-5 h-5 ${isDark ? "text-white/80" : "text-gray-600"}`}
                                            strokeWidth={1.5}
                                        />
                                    </div>

                                    <h3
                                        className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
                                    >
                                        {feature.title}
                                    </h3>

                                    <p
                                        className={`text-sm leading-relaxed max-w-md ${isDark ? "text-white/60" : "text-gray-500"}`}
                                    >
                                        {feature.description}
                                    </p>
                                </div>

                                {/* Corner decoration for large cells */}
                                {isLarge && (
                                    <div
                                        className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl
                                        ${isDark ? "bg-white/5" : "bg-gray-200/50"}`}
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
