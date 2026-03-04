import { BackgroundPaths } from "@/components/ui/background-paths";
import Hero from "@/components/Hero";
import WorkflowPipeline from "@/components/WorkflowPipeline";
import BentoFeatures from "@/components/BentoFeatures";
import StatsMarquee from "@/components/StatsMarquee";
import CTASection from "@/components/CTASection";

export default function Home() {
  return (
    <>
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
        {/* Animated background paths layer */}
        <div className="absolute inset-0 z-0">
          <BackgroundPaths title="" />
        </div>

        {/* Hero content on top */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center px-8 pt-10 sm:px-24 pb-32">
          <Hero />
        </div>
      </main>

      {/* Sections below hero */}
      <WorkflowPipeline />
      <StatsMarquee />
      <BentoFeatures />
      <CTASection />
    </>
  );
}

