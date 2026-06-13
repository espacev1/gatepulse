"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

// Animated counter hook
function useCounter(to: number, duration = 2.2) {
  const [count, setCount] = useState(0);
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / (duration * 1000), 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(ease * to));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [inView, to, duration]);

  return { count, ref: nodeRef };
}

const stats = [
  {
    value: 4500,
    suffix: "+",
    label: "Active Students",
    desc: "Registered on the platform",
    color: "#003B8E",
    accentBg: "rgba(0,59,142,0.06)",
  },
  {
    value: 120,
    suffix: "+",
    label: "Events Hosted",
    desc: "Across all departments",
    color: "#0057D8",
    accentBg: "rgba(0,87,216,0.06)",
  },
  {
    value: 2,
    suffix: "s",
    label: "Check-in Speed",
    desc: "Average venue scan time",
    color: "#D4AF37",
    accentBg: "rgba(212,175,55,0.08)",
  },
  {
    value: 99,
    suffix: "%",
    label: "Satisfaction",
    desc: "Student-reported rating",
    color: "#16A34A",
    accentBg: "rgba(22,163,74,0.06)",
  },
];

function StatCard({
  stat,
  index,
}: {
  stat: (typeof stats)[0];
  index: number;
}) {
  const { count, ref } = useCounter(stat.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col p-8 md:p-10 bg-white rounded-3xl border border-slate-100 overflow-hidden hover:border-transparent transition-all duration-300 hover:shadow-[0_16px_60px_rgba(0,0,0,0.08)]"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
        style={{
          background: `radial-gradient(ellipse 60% 60% at 30% 80%, ${stat.accentBg.replace("0.06", "0.2")}, transparent)`,
        }}
      />

      {/* Accent chip */}
      <div
        className="inline-flex self-start items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] uppercase mb-8 px-2.5 py-1 rounded-full"
        style={{ color: stat.color, background: stat.accentBg }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: stat.color }}
        />
        {stat.label}
      </div>

      {/* Big number */}
      <div className="flex items-end gap-1 mb-2">
        <span
          ref={ref}
          className="text-[4rem] md:text-[5rem] font-bold tracking-tighter leading-none tabular-nums"
          style={{ color: stat.color }}
        >
          {count}
        </span>
        <span
          className="text-[3rem] md:text-[4rem] font-bold leading-none mb-1"
          style={{ color: stat.color }}
        >
          {stat.suffix}
        </span>
      </div>

      <p className="text-slate-400 text-[13px] font-medium leading-snug relative z-10">
        {stat.desc}
      </p>

      {/* Bottom inset bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 origin-left"
        style={{ background: stat.color }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.9, delay: index * 0.1 + 0.4, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.div>
  );
}

// Testimonial strip
const testimonials = [
  { quote: "VIT Pulse completely transformed how we manage 3,000-student events.", author: "Dr. R. Kiranmai", role: "Dean of Student Affairs" },
  { quote: "Check-in that used to take 40 minutes now happens in under 2.", author: "Aditya Nair", role: "E-Cell President" },
  { quote: "The real-time leaderboards during the hackathon were incredible.", author: "Priya Sharma", role: "CSE Final Year" },
];

export function ImpactSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <section id="impact" ref={sectionRef} className="py-32 md:py-48 bg-white relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(0,87,216,0.04),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_0%_50%,rgba(212,175,55,0.04),transparent)] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#003B8E] mb-5"
          >
            <span className="w-6 h-px bg-[#003B8E]" />
            Real Impact
            <span className="w-6 h-px bg-[#003B8E]" />
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(2rem,4.5vw,4rem)] font-bold tracking-tighter text-[#0F172A] leading-[1.05] mb-5"
          >
            Measurable{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#003B8E] to-[#0057D8]">
              impact.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-slate-500 text-base md:text-lg leading-relaxed"
          >
            VIT Pulse is high-performance infrastructure built for the scale of a
            modern educational institution.
          </motion.p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-24">
          {stats.map((stat, i) => (
            <StatCard key={i} stat={stat} index={i} />
          ))}
        </div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-[#F5F8FC] rounded-2xl p-6 border border-slate-100"
            >
              {/* Quote marks */}
              <div className="text-[3rem] leading-none text-[#003B8E]/15 font-serif mb-3 select-none">&ldquo;</div>
              <p className="text-[#0F172A] font-medium text-[15px] leading-relaxed mb-5">
                {t.quote}
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#003B8E] to-[#0057D8] flex items-center justify-center text-white text-xs font-bold">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#0F172A]">{t.author}</div>
                  <div className="text-[11px] text-slate-400">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
