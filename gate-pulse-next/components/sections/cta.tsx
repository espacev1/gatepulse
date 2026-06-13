"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="relative py-32 md:py-48 bg-[var(--color-brand-text)] overflow-hidden">
      {/* Background Abstract */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--color-brand-primary)]/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--color-brand-secondary)]/20 rounded-full blur-[80px]" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white mb-8 leading-[1.1]"
          >
            Experience Campus <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[var(--color-brand-accent)]">
              Like Never Before.
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl font-medium leading-relaxed"
          >
            Join the digital heartbeat of Vishnu Institute of Technology. Start exploring today.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <button className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-white px-8 font-semibold text-slate-900 transition-all hover:scale-105 active:scale-95">
              <span className="relative flex items-center gap-2">
                Get Started Now
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </span>
            </button>
            <button className="group inline-flex h-14 items-center justify-center rounded-full border border-slate-700 bg-slate-800/50 backdrop-blur-sm px-8 font-semibold text-white transition-all hover:bg-slate-800 active:scale-95">
              Contact Organizing Team
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
