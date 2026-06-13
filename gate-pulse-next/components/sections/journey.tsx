"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Discover",
    desc: "Browse a curated feed of campus events, from high-stakes hackathons to cultural festivals.",
  },
  {
    num: "02",
    title: "Register",
    desc: "One-click registration with automated digital QR ticket generation sent directly to your inbox.",
  },
  {
    num: "03",
    title: "Participate",
    desc: "Experience sub-2-second express check-ins at the venue using our secure scanner system.",
  },
  {
    num: "04",
    title: "Compete",
    desc: "Engage in live events with real-time scoring and dynamic leaderboards managed by jury portals.",
  },
  {
    num: "05",
    title: "Achieve",
    desc: "Build your digital portfolio. Every event adds to your verifiable campus achievement record.",
  },
];

export function JourneySection() {
  const targetRef = useRef<HTMLDivElement>(null);
  
  // Horizontal scroll logic
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);

  return (
    <section 
      id="journey"
      ref={targetRef} 
      className="relative h-[300vh] bg-[var(--color-brand-text)]"
    >
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        
        <div className="container mx-auto px-6 absolute left-0 right-0 top-24 md:top-32 max-w-7xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            The Student Journey.
          </h2>
          <p className="text-slate-400 mt-4 max-w-xl">
            A frictionless path from discovery to achievement, designed to elevate your campus experience.
          </p>
        </div>

        <motion.div style={{ x }} className="flex gap-8 md:gap-16 pl-[10%] md:pl-[20%] mt-20">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="w-[300px] md:w-[400px] flex-shrink-0"
            >
              <div className="text-6xl md:text-8xl font-bold text-white/10 mb-8 font-mono">
                {step.num}
              </div>
              <div className="h-0.5 w-full bg-slate-800 relative mb-12">
                <div className="absolute top-1/2 left-0 w-4 h-4 -translate-y-1/2 bg-[var(--color-brand-primary)] rounded-full shadow-[0_0_20px_rgba(0,59,142,1)]" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {step.title}
              </h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
          {/* Spacer at the end so the last item can be fully scrolled into view */}
          <div className="w-[10vw] flex-shrink-0" />
        </motion.div>

      </div>
    </section>
  );
}
