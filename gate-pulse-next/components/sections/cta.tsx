"use client";

import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";

// Animated particle dots
function Particle({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: "#0057D8" }}
      animate={{
        opacity: [0, 0.6, 0],
        scale: [0, 1, 0],
        y: [0, -40, -80],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay,
        repeat: Infinity,
        repeatDelay: 1 + Math.random() * 3,
        ease: "easeOut",
      }}
    />
  );
}

const particles = Array.from({ length: 14 }, (_, i) => ({
  delay: i * 0.4,
  x: `${8 + Math.random() * 84}%`,
  y: `${60 + Math.random() * 30}%`,
  size: 2 + Math.random() * 3,
}));

// Grid lines
function GridLines() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "64px 64px",
        maskImage:
          "radial-gradient(ellipse 70% 70% at 50% 50%, black 10%, transparent 100%)",
      }}
    />
  );
}

export function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: "-20%" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgScale = useTransform(scrollYProgress, [0, 0.5], [0.9, 1.0]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.3], [0.4, 1.0]);

  return (
    <section
      ref={sectionRef}
      className="relative py-32 md:py-48 bg-[#060E24] overflow-hidden"
    >
      {/* Deep background layer */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(0,59,142,0.35),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_20%,rgba(0,87,216,0.15),transparent)]" />

      {/* Grid */}
      <GridLines />

      {/* Animated orbs */}
      <motion.div
        style={{ scale: bgScale, opacity: bgOpacity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] pointer-events-none"
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(0,59,142,0.25)_0%,transparent_70%)] blur-[60px]" />
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(0,87,216,0.2)_0%,transparent_70%)] blur-[40px] pointer-events-none"
      />

      {/* Gold accent orb */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[15%] right-[15%] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.3),transparent_70%)] blur-[60px] pointer-events-none"
      />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      {/* Main content */}
      <div className="container mx-auto px-6 relative z-10 max-w-5xl">
        <div className="flex flex-col items-center text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 mb-10 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-[11px] font-semibold text-white/60 tracking-[0.1em] uppercase">
              Join VIT Pulse Today
            </span>
          </motion.div>

          {/* Headline */}
          <div className="mb-8 overflow-hidden">
            <motion.h2
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(3rem,8vw,7rem)] font-bold tracking-tighter text-white leading-[0.92]"
            >
              Experience campus
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F8EF7] via-[#7AAFFF] to-[#D4AF37]">
                like never before.
              </span>
            </motion.h2>
          </div>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-white/50 text-lg md:text-xl max-w-lg leading-relaxed mb-12 font-medium"
          >
            Join the digital heartbeat of Vishnu Institute of Technology.
            Start exploring events today.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="flex flex-col sm:flex-row items-center gap-3 mb-20"
          >
            <Link
              href="/auth"
              className="group relative inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 font-bold text-[#003B8E] text-[15px] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(255,255,255,0.25)] active:scale-[0.97]"
            >
              Get Started — It&apos;s Free
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="mailto:vitpulse@vit.ac.in"
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] backdrop-blur-sm px-7 py-3.5 font-medium text-white/80 text-[15px] transition-all duration-200 hover:bg-white/[0.08] hover:border-white/25 active:scale-[0.97]"
            >
              <Mail size={14} className="text-white/50" />
              Contact Organizers
            </Link>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 text-white/30 text-[12px] font-medium"
          >
            {[
              "Vishnu Institute of Technology",
              "Bhimavaram · Andhra Pradesh",
              "Est. 1997",
              "NAAC A+ Accredited",
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-white/20" />}
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
