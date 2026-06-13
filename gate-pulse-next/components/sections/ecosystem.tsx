"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Code2, Presentation, Trophy, Cpu, Mic2 } from "lucide-react";
import { cn } from "@/lib/utils";

const events = [
  {
    title: "Technical Symposiums",
    description: "Deep-dive sessions into emerging technologies, featuring paper presentations and advanced coding challenges.",
    icon: <Code2 className="w-6 h-6" />,
    className: "md:col-span-2 md:row-span-2 bg-[var(--color-brand-surface)]",
    iconBg: "bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]",
  },
  {
    title: "Cultural Fests",
    description: "Annual celebrations of art, music, and diverse campus talent.",
    icon: <Mic2 className="w-6 h-6" />,
    className: "md:col-span-1 bg-white border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.02)]",
    iconBg: "bg-purple-100 text-purple-600",
  },
  {
    title: "Robotics Competitions",
    description: "Design, build, and race autonomous machines.",
    icon: <Cpu className="w-6 h-6" />,
    className: "md:col-span-1 bg-white border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.02)]",
    iconBg: "bg-amber-100 text-amber-600",
  },
  {
    title: "Startup Pitch Deck",
    description: "Present your business ideas to real-world investors.",
    icon: <Presentation className="w-6 h-6" />,
    className: "md:col-span-1 bg-[var(--color-brand-text)] text-white",
    iconBg: "bg-white/10 text-white",
    dark: true,
  },
  {
    title: "Sports Tournaments",
    description: "Inter-departmental and inter-college athletic events.",
    icon: <Trophy className="w-6 h-6" />,
    className: "md:col-span-1 bg-white border border-slate-100 shadow-[0_2px_20px_rgb(0,0,0,0.02)]",
    iconBg: "bg-green-100 text-green-600",
  },
];

export function EcosystemSection() {
  return (
    <section id="events" className="py-32 bg-slate-50 relative">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[var(--color-brand-primary)] font-semibold tracking-wide uppercase text-sm mb-3 block"
            >
              The Ecosystem
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-brand-text)]"
            >
              A spectrum of opportunities.
            </motion.h2>
          </div>
          <motion.button 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="group flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-secondary)] transition-colors"
          >
            View all events
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </motion.button>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[240px]">
          {events.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "rounded-3xl p-8 flex flex-col justify-between group overflow-hidden relative transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--color-brand-primary)]/5",
                item.className
              )}
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", item.iconBg)}>
                {item.icon}
              </div>
              <div className="relative z-10">
                <h3 className={cn("text-xl font-bold mb-2 tracking-tight", item.dark ? "text-white" : "text-slate-900")}>
                  {item.title}
                </h3>
                <p className={cn("text-sm font-medium leading-relaxed max-w-sm", item.dark ? "text-slate-300" : "text-slate-500")}>
                  {item.description}
                </p>
              </div>
              
              {/* Subtle background decoration for the first large card */}
              {i === 0 && (
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[var(--color-brand-primary)]/5 rounded-full blur-3xl pointer-events-none" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
