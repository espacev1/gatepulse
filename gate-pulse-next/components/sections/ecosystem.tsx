"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Code2, Presentation, Trophy, Cpu, Mic2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const events = [
  {
    id: "tech",
    title: "Technical Symposiums",
    description:
      "Deep-dive sessions into emerging technologies with paper presentations, advanced coding challenges, and live technical assessments.",
    icon: Code2,
    span: "md:col-span-2 md:row-span-2",
    accent: "#003B8E",
    accentBg: "rgba(0,59,142,0.08)",
    gradient: "from-[#003B8E]/10 via-transparent to-transparent",
    tag: "Tech",
    featured: true,
  },
  {
    id: "culture",
    title: "Cultural Fests",
    description: "Annual celebrations of art, music, and diverse campus talent.",
    icon: Mic2,
    span: "md:col-span-1 md:row-span-1",
    accent: "#7C3AED",
    accentBg: "rgba(124,58,237,0.08)",
    gradient: "from-purple-500/10 via-transparent to-transparent",
    tag: "Arts",
    featured: false,
  },
  {
    id: "robotics",
    title: "Robotics & AI",
    description: "Design, build, and race autonomous machines against top teams.",
    icon: Cpu,
    span: "md:col-span-1 md:row-span-1",
    accent: "#D97706",
    accentBg: "rgba(217,119,6,0.08)",
    gradient: "from-amber-500/10 via-transparent to-transparent",
    tag: "Engineering",
    featured: false,
  },
  {
    id: "startup",
    title: "Startup Pitches",
    description: "Present your venture idea to real-world investors and industry experts.",
    icon: Presentation,
    span: "md:col-span-1 md:row-span-1",
    accent: "#D4AF37",
    accentBg: "rgba(212,175,55,0.08)",
    gradient: "from-yellow-500/10 via-transparent to-transparent",
    tag: "Business",
    featured: false,
    dark: true,
  },
  {
    id: "sports",
    title: "Sports Tournaments",
    description: "Inter-departmental athletic events from cricket to e-sports.",
    icon: Trophy,
    span: "md:col-span-1 md:row-span-1",
    accent: "#16A34A",
    accentBg: "rgba(22,163,74,0.08)",
    gradient: "from-emerald-500/10 via-transparent to-transparent",
    tag: "Sports",
    featured: false,
  },
  {
    id: "research",
    title: "Research Expo",
    description: "Showcase student research to faculty, industry, and peers.",
    icon: BookOpen,
    span: "md:col-span-1 md:row-span-1",
    accent: "#0057D8",
    accentBg: "rgba(0,87,216,0.08)",
    gradient: "from-blue-500/10 via-transparent to-transparent",
    tag: "Research",
    featured: false,
  },
];

function BentoCard({
  event,
  index,
}: {
  event: (typeof events)[0];
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = event.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative group rounded-3xl p-7 flex flex-col justify-between overflow-hidden cursor-default transition-transform duration-300",
        event.span,
        event.dark
          ? "bg-[#0F172A] border border-white/[0.06]"
          : "bg-white border border-slate-100",
        hovered ? "-translate-y-1 shadow-2xl" : "shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
      )}
      style={{
        boxShadow: hovered
          ? `0 20px 60px ${event.accent}22, 0 4px 24px rgba(0,0,0,0.08)`
          : undefined,
      }}
    >
      {/* Background gradient blob */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          event.gradient
        )}
      />

      {/* Featured background glow */}
      {event.featured && (
        <div
          className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-opacity duration-500"
          style={{ background: `${event.accent}15`, opacity: hovered ? 1 : 0.5 }}
        />
      )}

      {/* Top row: icon + tag */}
      <div className="relative z-10 flex items-start justify-between mb-auto">
        <motion.div
          animate={{ scale: hovered ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ background: event.accentBg }}
        >
          <Icon size={20} style={{ color: event.accent }} />
        </motion.div>

        <span
          className="text-[10px] font-bold tracking-[0.12em] uppercase px-2.5 py-1 rounded-full"
          style={{ color: event.accent, background: event.accentBg }}
        >
          {event.tag}
        </span>
      </div>

      {/* Bottom content */}
      <div className="relative z-10 mt-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3
              className={cn(
                "font-bold text-xl tracking-tight mb-2.5 leading-tight",
                event.dark ? "text-white" : "text-[#0F172A]"
              )}
            >
              {event.title}
            </h3>
            <p
              className={cn(
                "text-[13px] leading-relaxed",
                event.featured
                  ? "text-slate-500"
                  : event.dark
                  ? "text-slate-400"
                  : "text-slate-500"
              )}
            >
              {event.description}
            </p>
          </div>

          {/* Arrow — appears on hover */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.15 }}
                className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center self-end"
                style={{ background: event.accentBg }}
              >
                <ArrowUpRight size={15} style={{ color: event.accent }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Inset border glow on hover */}
      <div
        className="absolute inset-0 rounded-3xl border opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ borderColor: `${event.accent}30` }}
      />
    </motion.div>
  );
}

// Marquee strip
const marqueeItems = [
  "Hackathon",
  "Cultural Fest",
  "Robotics",
  "Symposium",
  "Startup Pitch",
  "Sports Day",
  "Research Expo",
  "Workshop",
  "Code Sprint",
  "Innovation Fair",
];

export function EcosystemSection() {
  return (
    <section id="events" className="py-32 md:py-48 bg-[#F5F8FC] relative overflow-hidden">
      {/* Subtle top gradient */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-white to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#003B8E] mb-5"
            >
              <span className="w-6 h-px bg-[#003B8E]" />
              Events Ecosystem
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(2rem,4.5vw,4rem)] font-bold tracking-tighter text-[#0F172A] leading-[1.05]"
            >
              A spectrum of <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#003B8E] to-[#0057D8]">
                opportunities.
              </span>
            </motion.h2>
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="group flex items-center gap-2 text-[13px] font-semibold text-[#003B8E] hover:text-[#0057D8] transition-colors self-start md:self-auto"
          >
            View all events
            <ArrowUpRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </motion.button>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[260px]">
          {events.map((event, i) => (
            <BentoCard key={event.id} event={event} index={i} />
          ))}
        </div>

        {/* Marquee strip */}
        <div className="mt-20 overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#F5F8FC] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#F5F8FC] to-transparent z-10 pointer-events-none" />
          <div className="flex whitespace-nowrap" style={{ animation: "marquee 28s linear infinite" }}>
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-4 px-4 text-sm font-semibold text-slate-400 tracking-wide uppercase"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: events[i % events.length]?.accent ?? "#003B8E" }}
                />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
