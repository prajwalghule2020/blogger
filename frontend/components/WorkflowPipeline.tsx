"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Lightbulb, Search, Globe, PenTool, Rocket } from "lucide-react";

const steps = [
    {
        icon: Lightbulb,
        title: "Topic Intelligence",
        description: "AI discovers trending topics and content gaps in your niche",
        accent: "from-amber-400 to-orange-500",
    },
    {
        icon: Search,
        title: "Search & Evaluate",
        description: "Deep research across thousands of authoritative sources",
        accent: "from-blue-400 to-cyan-500",
    },
    {
        icon: Globe,
        title: "Deep Scrape",
        description: "Extract insights, data points, and key arguments at scale",
        accent: "from-emerald-400 to-teal-500",
    },
    {
        icon: PenTool,
        title: "Write & Assemble",
        description: "AI crafts publication-ready content with your brand voice",
        accent: "from-purple-400 to-violet-500",
    },
    {
        icon: Rocket,
        title: "Publish",
        description: "One-click distribution to your channels and audience",
        accent: "from-rose-400 to-pink-500",
    },
];

export default function WorkflowPipeline() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section className="py-24 px-6 lg:px-8 bg-white" ref={ref}>
            <div className="max-w-6xl mx-auto">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <p className="text-xs font-bold tracking-[0.25em] uppercase text-gray-400 mb-3">
                        How it works
                    </p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                        From idea to published
                        <br />
                        <span className="text-gray-400">in minutes, not days</span>
                    </h2>
                </motion.div>

                {/* Pipeline */}
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-0">
                    {/* Connector line (desktop) */}
                    <div className="hidden md:block absolute top-10 left-[10%] right-[10%] h-px">
                        <motion.div
                            className="h-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"
                            initial={{ scaleX: 0 }}
                            animate={isInView ? { scaleX: 1 } : {}}
                            transition={{ duration: 1.2, delay: 0.3 }}
                            style={{ transformOrigin: "left" }}
                        />
                        {/* Animated pulse dot */}
                        {isInView && (
                            <motion.div
                                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-900"
                                initial={{ left: "0%" }}
                                animate={{ left: "100%" }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                            />
                        )}
                    </div>

                    {steps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{
                                duration: 0.5,
                                delay: 0.2 + index * 0.15,
                            }}
                            className="relative flex-1 flex flex-col items-center text-center group"
                        >
                            {/* Icon container */}
                            <div className="relative mb-5">
                                <div
                                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.accent} p-[1px] 
                                    group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}
                                >
                                    <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                                        <step.icon className="w-7 h-7 text-gray-700" strokeWidth={1.5} />
                                    </div>
                                </div>
                                {/* Step number */}
                                <span
                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 text-white 
                                    text-[10px] font-bold flex items-center justify-center"
                                >
                                    {index + 1}
                                </span>
                            </div>

                            <h3 className="text-sm font-bold text-gray-900 mb-1">
                                {step.title}
                            </h3>
                            <p className="text-xs text-gray-500 max-w-[160px] leading-relaxed">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
