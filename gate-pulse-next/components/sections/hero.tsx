"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronRight, Calendar, Users, Zap } from "lucide-react";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[var(--color-brand-background)] pt-20"
    >
      {/* Background gradients and glows */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[var(--color-brand-primary)]/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-[var(--color-brand-secondary)]/10 blur-[100px]" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_10%,transparent_100%)]" />
      </div>

      <motion.div 
        style={{ y, opacity }}
        className="container relative z-10 px-6 mx-auto flex flex-col items-center text-center max-w-5xl"
      >
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200 backdrop-blur-md mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-[var(--color-brand-primary)]" />
          <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
            Vishnu Institute of Technology
          </span>
        </motion.div>

        {/* Massive Headline */}
        <div className="overflow-hidden pb-4">
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-[var(--color-brand-text)] leading-[0.9]"
          >
            THE DIGITAL <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-secondary)]">
              HEARTBEAT
            </span> <br className="hidden md:block" />
            OF VIT
          </motion.h1>
        </div>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 text-lg md:text-xl text-slate-500 max-w-2xl font-medium"
        >
          One intelligent platform connecting events, innovation, communities, opportunities, and student achievements.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <button className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-[var(--color-brand-text)] px-8 font-medium text-white transition-all hover:scale-105 active:scale-95">
            <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black" />
            <span className="relative flex items-center gap-2">
              Explore Events
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
          </button>
          <button className="group inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-8 font-medium text-slate-700 transition-all hover:bg-slate-50 active:scale-95">
            Create Event
          </button>
        </motion.div>
      </motion.div>

      {/* Floating UI Elements (Parallax) */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block overflow-hidden">
        <motion.div 
          style={{ y: useTransform(scrollYProgress, [0, 1], ["0%", "-100%"]) }}
          className="absolute top-[20%] left-[10%] p-4 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-[var(--color-brand-accent)]">
              <Zap size={20} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Live Event</div>
              <div className="text-sm font-bold text-slate-800">Nexus Hackathon</div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          style={{ y: useTransform(scrollYProgress, [0, 1], ["0%", "-150%"]) }}
          className="absolute bottom-[25%] right-[12%] p-4 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[var(--color-brand-secondary)]">
              <Users size={20} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Registrations</div>
              <div className="text-sm font-bold text-slate-800">1,240 Students</div>
            </div>
          </div>
        </motion.div>
      </div>

    </section>
  );
}
