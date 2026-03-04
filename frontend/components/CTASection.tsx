"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTASection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });

    return (
        <section
            ref={ref}
            className="relative py-32 px-6 lg:px-8 bg-[#18181b] overflow-hidden"
        >
            {/* Background pattern */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Grid dots */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle, white 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                    }}
                />
                {/* Gradient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-white/[0.03] rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                >
                    <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/30 mb-4">
                        Ready to start?
                    </p>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-6">
                        Stop researching.
                        <br />
                        <span className="text-white/40">Start publishing.</span>
                    </h2>

                    <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
                        Join thousands of publishers and content teams who use
                        Synapse AI to produce research-backed articles at 10x
                        speed.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            className="rounded-full bg-white text-black text-sm font-semibold 
                            hover:bg-gray-100 px-8 py-6 transition-all duration-300 
                            hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] group"
                        >
                            Get Started Free
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>

                        <Button
                            variant="ghost"
                            className="rounded-full text-white/60 hover:text-white text-sm font-semibold 
                            px-8 py-6 border border-white/10 hover:border-white/20
                            hover:bg-white/5 transition-all duration-300"
                        >
                            Talk to Sales
                        </Button>
                    </div>

                    <p className="text-[11px] text-white/25 mt-6">
                        No credit card required · Free tier available · Cancel
                        anytime
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
