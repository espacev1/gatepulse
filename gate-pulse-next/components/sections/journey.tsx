"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Discover",
    body: "Browse a curated feed of campus events — from high-stakes hackathons to cultural festivals — filtered by your interests and department.",
    color: "#003B8E",
    bg: "rgba(0,59,142,0.08)",
  },
  {
    num: "02",
    title: "Register",
    body: "One-tap registration with automated QR ticket generation and a digital confirmation sent directly to your VIT inbox.",
    color: "#0057D8",
    bg: "rgba(0,87,216,0.08)",
  },
  {
    num: "03",
    title: "Participate",
    body: "Experience sub-2-second express check-ins at the venue using our secure QR scanner infrastructure.",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.08)",
  },
  {
    num: "04",
    title: "Compete",
    body: "Engage in live events with real-time scoring, dynamic leaderboards, and faculty jury portals — all synced instantly.",
    color: "#D97706",
    bg: "rgba(217,119,6,0.08)",
  },
  {
    num: "05",
    title: "Achieve",
    body: "Build your digital portfolio. Every event adds a verifiable achievement to your permanent campus record.",
    color: "#D4AF37",
    bg: "rgba(212,175,55,0.10)",
  },
];

function StepCard({
  step,
  index,
  total,
}: {
  step: (typeof steps)[0];
  index: number;
  total: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.7,
        delay: index * 0.12,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="flex-shrink-0 w-[300px] md:w-[380px]"
    >
      <div className="group relative h-full">
        {/* Large number watermark */}
        <div
          className="text-[7rem] md:text-[9rem] font-bold leading-none mb-6 tracking-tighter select-none transition-all duration-300 group-hover:scale-105"
          style={{ color: `${step.color}18` }}
        >
          {step.num}
        </div>

        {/* Divider */}
        <div className="relative h-px w-full bg-white/10 mb-10 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 h-full"
            style={{ background: step.color }}
            initial={{ width: "0%" }}
            whileInView={{ width: "30%" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1, delay: index * 0.12 + 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
          {/* Dot */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white"
            style={{ background: step.color }}
            initial={{ left: "0%" }}
            whileInView={{ left: "28%" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1, delay: index * 0.12 + 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Content */}
        <div
          className="rounded-2xl p-6 border border-white/[0.06] transition-all duration-300 group-hover:border-white/[0.12]"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div
            className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] uppercase mb-3 px-2.5 py-1 rounded-full"
            style={{ color: step.color, background: step.bg }}
          >
            Step {step.num}
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
            {step.title}
          </h3>
          <p className="text-slate-400 text-[14px] leading-relaxed">
            {step.body}
          </p>
        </div>

        {/* Connector arrow (not on last) */}
        {index < total - 1 && (
          <div className="absolute top-[4.5rem] -right-6 md:-right-8 text-white/10 text-2xl font-light select-none hidden md:block">
            →
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function JourneySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Horizontal scroll: map vertical scroll to horizontal translation
  const rawX = useTransform(scrollYProgress, [0.05, 0.95], ["0%", "-62%"]);
  const x = useSpring(rawX, { stiffness: 60, damping: 18 });

  // Gradient orb movement
  const orbX = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);

  return (
    <section
      id="journey"
      ref={sectionRef}
      className="relative bg-[#0F172A]"
      style={{ height: `${steps.length * 90}vh` }}
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orb */}
        <motion.div
          style={{ x: orbX }}
          className="absolute top-1/2 -translate-y-1/2 -left-[20%] w-[60%] h-[60%] rounded-full opacity-30 blur-[100px]"
          animate={{
            background: [
              "radial-gradient(circle, rgba(0,59,142,0.5), transparent)",
              "radial-gradient(circle, rgba(0,87,216,0.5), transparent)",
              "radial-gradient(circle, rgba(0,59,142,0.5), transparent)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Dot matrix */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, #64748b 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">

        {/* Section header */}
        <div className="container mx-auto px-6 max-w-7xl mb-12 flex-shrink-0">
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#0057D8] mb-4"
          >
            <span className="w-6 h-px bg-[#0057D8]" />
            Student Journey
          </motion.span>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(2rem,4vw,3.5rem)] font-bold tracking-tighter text-white leading-[1.0]"
            >
              From discovery<br />to achievement.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-slate-400 text-[14px] max-w-xs leading-relaxed"
            >
              A frictionless five-step path designed to elevate every campus experience.
            </motion.p>
          </div>
        </div>

        {/* Horizontal scroll track */}
        <div className="overflow-hidden px-6 md:px-0 flex-1 flex items-center">
          <motion.div
            ref={trackRef}
            style={{ x }}
            className="flex gap-8 md:gap-12 pl-[max(1.5rem,calc((100vw-80rem)/2))] pr-[12vw] items-stretch"
          >
            {steps.map((step, i) => (
              <StepCard key={step.num} step={step} index={i} total={steps.length} />
            ))}
          </motion.div>
        </div>

        {/* Progress indicator */}
        <div className="container mx-auto px-6 max-w-7xl mt-8 flex-shrink-0">
          <div className="flex items-center gap-2">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="h-0.5 rounded-full"
                style={{ background: step.color }}
                initial={{ width: "16px", opacity: 0.3 }}
                animate={{ opacity: 0.3 }}
              />
            ))}
            <span className="text-slate-500 text-xs font-medium ml-2">Scroll to explore</span>
          </div>
        </div>
      </div>
    </section>
  );
}
