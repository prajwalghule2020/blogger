"use client";

const stats = [
    { value: "2.4M+", label: "Articles Generated" },
    { value: "150K+", label: "Topics Analyzed" },
    { value: "98.7%", label: "Accuracy Rate" },
    { value: "47", label: "Languages Supported" },
    { value: "12K+", label: "Active Publishers" },
    { value: "3.2B", label: "Words Written" },
    { value: "500+", label: "Enterprise Teams" },
    { value: "99.9%", label: "Uptime SLA" },
];

export default function StatsMarquee() {
    // Double the items for seamless loop
    const doubled = [...stats, ...stats];

    return (
        <section className="py-16 bg-white overflow-hidden border-y border-gray-100">
            {/* Fade edges */}
            <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                {/* Scrolling strip */}
                <div className="flex animate-marquee">
                    {doubled.map((stat, index) => (
                        <div
                            key={`${stat.label}-${index}`}
                            className="flex-shrink-0 flex items-center gap-3 px-10"
                        >
                            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tabular-nums tracking-tight">
                                {stat.value}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 whitespace-nowrap">
                                {stat.label}
                            </span>
                            <span className="ml-6 w-1 h-1 rounded-full bg-gray-300" />
                        </div>
                    ))}
                </div>
            </div>

            {/* CSS animation */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `,
                }}
            />
        </section>
    );
}
