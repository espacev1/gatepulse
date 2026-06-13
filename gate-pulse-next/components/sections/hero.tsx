"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, Zap, Users, Calendar, Award } from "lucide-react";
import Link from "next/link";

// Animated light streak component
function LightStreak({
  delay = 0,
  top,
  left,
  width,
  angle,
}: {
  delay?: number;
  top: string;
  left: string;
  width: string;
  angle: string;
}) {
  return (
    <motion.div
      className="absolute h-px pointer-events-none"
      style={{ top, left, width, rotate: angle }}
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{
        scaleX: [0, 1, 1, 0],
        opacity: [0, 0.6, 0.6, 0],
      }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        repeatDelay: 4 + delay,
        ease: "easeInOut",
      }}
      style={{ originX: 0 }}
    >
      <div className="h-full w-full bg-gradient-to-r from-transparent via-[#0057D8]/60 to-transparent" />
    </motion.div>
  );
}

// Floating stat card
function FloatingCard({
  icon: Icon,
  label,
  value,
  color,
  style,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  style?: React.CSSProperties;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute glass rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,59,142,0.12)] hidden lg:flex items-center gap-3"
      style={style}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: delay * 0.5, ease: "easeInOut" }}
        className="flex items-center gap-3"
      >
        <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} />
        </div>
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none mb-0.5">{label}</div>
          <div className="text-sm font-bold text-slate-800 leading-none">{value}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Gradient orb
function GradientOrb({
  className,
  delay = 0,
}: {
  className: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      animate={{
        scale: [1, 1.08, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 6 + delay,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

// Word-by-word text reveal
function RevealText({
  children,
  delay = 0,
  className,
}: {
  children: string;
  delay?: number;
  className?: string;
}) {
  const words = children.split(" ");
  return (
    <span className={`inline-flex flex-wrap gap-x-[0.25em] ${className ?? ""}`}>
      {words.map((word, i) => (
        <span key={i} className="overflow-hidden inline-block">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{
              duration: 0.7,
              delay: delay + i * 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

const TAGLINES = [
  "Events",
  "Hackathons",
  "Innovation",
  "Leadership",
  "Achievement",
];

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [taglineIndex, setTaglineIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const rawY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const y = useSpring(rawY, { stiffness: 80, damping: 20 });
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((i) => (i + 1) % TAGLINES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-white"
    >
      {/* === BACKGROUND === */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Primary gradient mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,87,216,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_80%,rgba(212,175,55,0.06),transparent)]" />

        {/* Animated orbs */}
        <GradientOrb
          className="top-[-15%] left-[-5%] w-[55%] h-[55%] bg-[radial-gradient(circle,rgba(0,59,142,0.12),transparent_70%)]"
          delay={0}
        />
        <GradientOrb
          className="top-[20%] right-[-10%] w-[45%] h-[55%] bg-[radial-gradient(circle,rgba(0,87,216,0.09),transparent_70%)]"
          delay={2}
        />
        <GradientOrb
          className="bottom-[10%] left-[30%] w-[35%] h-[35%] bg-[radial-gradient(circle,rgba(212,175,55,0.07),transparent_70%)]"
          delay={1.5}
        />

        {/* Fine dot grid */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: "radial-gradient(circle, #94a3b8 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 100%)",
          }}
        />

        {/* Light streaks */}
        <LightStreak top="25%" left="5%" width="250px" angle="-8deg" delay={1} />
        <LightStreak top="45%" left="60%" width="180px" angle="5deg" delay={2.5} />
        <LightStreak top="70%" left="20%" width="140px" angle="-12deg" delay={4} />
        <LightStreak top="15%" left="75%" width="200px" angle="15deg" delay={3} />
      </div>

      {/* === CONTENT === */}
      <motion.div
        style={{ y, opacity }}
        className="container relative z-10 px-6 mx-auto flex flex-col items-center text-center max-w-6xl pt-28 md:pt-32"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2.5 mb-10 px-4 py-2 glass rounded-full border border-[#003B8E]/10 shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#003B8E] opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#003B8E]" />
          </span>
          <span className="text-[11px] font-semibold text-slate-600 tracking-[0.08em] uppercase">
            Vishnu Institute of Technology · Bhimavaram
          </span>
        </motion.div>

        {/* Headline — editorial scale */}
        <div className="mb-8">
          <h1 className="text-[clamp(3rem,9vw,8rem)] font-bold tracking-tighter text-[#0F172A] leading-[0.92]">
            <RevealText delay={0.2}>The Digital</RevealText>
            <br />
            <span className="inline-flex items-center gap-4 flex-wrap justify-center">
              <span className="overflow-hidden inline-block">
                <motion.span
                  className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#003B8E] via-[#0057D8] to-[#003B8E] bg-[length:200%_auto]"
                  initial={{ y: "110%", opacity: 0 }}
                  animate={{
                    y: "0%",
                    opacity: 1,
                    backgroundPosition: ["0% center", "200% center"],
                  }}
                  transition={{
                    y: { duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.7, delay: 0.35 },
                    backgroundPosition: { duration: 6, repeat: Infinity, ease: "linear" },
                  }}
                >
                  Heartbeat
                </motion.span>
              </span>
            </span>
            <br />
            <RevealText delay={0.5} className="text-[#0F172A]">of VIT</RevealText>
          </h1>
        </div>

        {/* Rotating tagline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="flex items-center gap-3 mb-6"
        >
          <span className="text-slate-400 text-lg md:text-xl font-medium">One platform for</span>
          <div className="relative h-8 w-36 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={taglineIndex}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -24, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center text-[#003B8E] font-bold text-lg md:text-xl"
              >
                {TAGLINES[taglineIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          className="text-slate-500 text-base md:text-lg max-w-xl leading-relaxed mb-12"
        >
          Seamless event discovery, instant registration, live check-in,
          and verifiable achievement records — all in one place.
        </motion.p>

        {/* CTA Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.85 }}
          className="flex flex-col sm:flex-row items-center gap-3 mb-20"
        >
          <Link
            href="/auth"
            className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#003B8E] px-7 font-semibold text-white text-[14px] transition-all duration-300 hover:bg-[#0057D8] hover:shadow-[0_8px_24px_rgba(0,87,216,0.4)] active:scale-[0.97]"
          >
            <span>Explore Events</span>
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent" />
          </Link>
          <Link
            href="#events"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm px-7 font-medium text-slate-700 text-[14px] transition-all duration-200 hover:border-[#003B8E]/30 hover:bg-white hover:text-[#003B8E] active:scale-[0.97]"
          >
            View Ecosystem
          </Link>
        </motion.div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="flex items-center gap-6 text-slate-400 text-xs font-medium"
        >
          {["4,500+ Students", "120+ Events", "99% Uptime"].map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#003B8E]/40" />
              {item}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* === FLOATING CARDS === */}
      <FloatingCard
        icon={Zap}
        label="Live Right Now"
        value="Nexus Hackathon"
        color="bg-amber-100 text-amber-600"
        style={{ top: "28%", left: "5%" }}
        delay={1.0}
      />
      <FloatingCard
        icon={Users}
        label="Registered Today"
        value="1,240 Students"
        color="bg-blue-100 text-[#003B8E]"
        style={{ top: "22%", right: "5%" }}
        delay={1.1}
      />
      <FloatingCard
        icon={Calendar}
        label="Next Event"
        value="Techfusion '25"
        color="bg-purple-100 text-purple-600"
        style={{ bottom: "22%", left: "6%" }}
        delay={1.2}
      />
      <FloatingCard
        icon={Award}
        label="Achievements"
        value="8,400 Awarded"
        color="bg-emerald-100 text-emerald-600"
        style={{ bottom: "28%", right: "6%" }}
        delay={1.3}
      />

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
      >
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-slate-400">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={16} className="text-slate-300" />
        </motion.div>
      </motion.div>
    </section>
  );
}
